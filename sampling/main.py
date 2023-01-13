import tensorflow as tf
import numpy as np
import json
import multiprocessing
import tqdm
from typing import List, Tuple
import math
from sklearn.preprocessing import MinMaxScaler
import joblib
import pandas as pd

from global_land_mask import globe
# import time

model = tf.keras.models.load_model("European_Model2")
scaler = joblib.load("scaler.gz")

COORDS = {
    "lat": {
        "min": 30,
        "max": 45,
    },
    "lon": {
        "min": -6,
        "max": 36,
    }
}

DAYS_IN_YEAR = 366

def convert_day(day: int):
    day /= DAYS_IN_YEAR - 1

    return np.sin(day * math.pi), np.cos(day * math.pi)

DEGREE_DIFF = 0.75

# get all latitudes and longitudes not on land
def get_lat_lons():
    print("collecting latitudes and longitudes...")

    lat_lons: List[Tuple[int, int]] = []

    for lat in np.arange(COORDS["lat"]["min"], COORDS["lat"]["max"] + DEGREE_DIFF, DEGREE_DIFF):
        for lon in np.arange(COORDS["lon"]["min"], COORDS["lon"]["max"] + DEGREE_DIFF, DEGREE_DIFF):
            # ensures lat and lon are in water before appending
            if not globe.is_land(lat, lon):
                lat_lons.append((lat, lon))

    print(f"retrieved {len(lat_lons)} latitudes and longitudes")
    return lat_lons

lat_lons = get_lat_lons()

# make predictions for all lats and lons on a given day
def add_prediction(day):    
    predictions = []
    day_sin, day_cos = convert_day(day)

    for lat, lon in lat_lons:
        data = {
            "cell_ll_lat": lat,
            "cell_ll_lon": lon,
            "sin": day_sin,
            "cos": day_cos,
        }

        input = pd.DataFrame(data, index=[0])
        input = scaler.transform(input)

        res = model.predict(input, verbose=0)

        predictions.append({
            "lat": lat.item(),
            "lon": lon.item(),
            "day": day,
            "result": res[0][0].item()
        })
    
    return predictions

if __name__ == '__main__':
    p = multiprocessing.Pool()
    days = range(0, DAYS_IN_YEAR)

    # make predictions in different processes and add to prediction list
    predictions = []
    for result in tqdm.tqdm(p.imap_unordered(add_prediction, days), total=len(days)):
        predictions.extend(result)

    # write predictions to things.json
    with open("../src/components/things.json", "w+") as f:
        json.dump(predictions, f)
