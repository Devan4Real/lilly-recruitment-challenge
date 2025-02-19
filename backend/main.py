from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
"""
This module defines a FastAPI application for managing a list of medicines.
It provides endpoints to retrieve all medicines, retrieve a single medicine by name,
and create a new medicine.
Endpoints:
- GET /medicines: Retrieve all medicines from the data.json file.
- GET /medicines/{name}: Retrieve a single medicine by name from the data.json file.
- POST /create: Create a new medicine with a specified name and price.
- PUT /update: Update the price of a medicine with a specified name.
- DELETE /delete: Delete a medicine with a specified name.
Functions:
- get_all_meds: Reads the data.json file and returns all medicines.
- get_single_med: Reads the data.json file and returns a single medicine by name.
- create_med: Reads the data.json file, adds a new medicine, and writes the updated data back to the file.
- update_med: Reads the data.json file, updates the price of a medicine, and writes the updated data back to the file.
- delete_med: Reads the data.json file, deletes a medicine, and writes the updated data back to the file.
Usage:
Run this module directly to start the FastAPI application.
"""
import uvicorn
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/medicines")
def get_all_meds():
    """
    This function reads the data.json file and returns all medicines.
    Returns:
        dict: A dictionary of all medicines
    """
    with open('data.json') as meds:
        data = json.load(meds)
    return data

@app.get("/medicines/{name}")
def get_single_med(name: str):
    """
    This function reads the data.json file and returns a single medicine by name.
    Args:
        name (str): The name of the medicine to retrieve.
    Returns:
        dict: A dictionary containing the medicine details
    """
    with open('data.json') as meds:
        data = json.load(meds)
        for med in data["medicines"]:
            print(med)
            if med['name'] == name:
                return med
    return {"error": "Medicine not found"}

@app.post("/create")
def create_med(name: str = Form(...), price: float = Form(...)):
    """
    This function creates a new medicine with the specified name and price.
    It expects the name and price to be provided as form data.
    Args:
        name (str): The name of the medicine.
        price (float): The price of the medicine.
    Returns:
        dict: A message confirming the medicine was created successfully.
    """
    with open('data.json', 'r+') as meds:
        current_db = json.load(meds)
        new_med = {"name": name, "price": price}
        current_db["medicines"].append(new_med)
        meds.seek(0)
        json.dump(current_db, meds)
        meds.truncate()
        
    return {"message": f"Medicine created successfully with name: {name}"}

@app.put("/update")
def update_med(name: str = Form(...), price: float = Form(...)):
    """
    This function updates the price of a medicine with the specified name.
    It expects the name and price to be provided as form data.
    Args:
        name (str): The name of the medicine.
        price (float): The new price of the medicine.
    Returns:
        dict: A message confirming the medicine was updated successfully.
    """
    with open('data.json', 'r+') as meds:
        current_db = json.load(meds)
        for med in current_db["medicines"]:
            if med['name'] == name:
                med['price'] = price
                meds.seek(0)
                json.dump(current_db, meds)
                meds.truncate()
                return {"message": f"Medicine updated successfully with name: {name}"}
    return {"error": "Medicine not found"}

@app.delete("/delete")
def delete_med(name: str = Form(...)):
    """
    This function deletes a medicine with the specified name.
    It expects the name to be provided as form data.
    Args:
        name (str): The name of the medicine to delete.
    Returns:
        dict: A message confirming the medicine was deleted successfully.
    """
    with open('data.json', 'r+') as meds:
        current_db = json.load(meds)
        for med in current_db["medicines"]:
            if med['name'] == name:
                current_db["medicines"].remove(med)
                meds.seek(0)
                json.dump(current_db, meds)
                meds.truncate()
                return {"message": f"Medicine deleted successfully with name: {name}"}
    return {"error": "Medicine not found"}

@app.get("/quarterly-report")
def quarterly_report():
    """
    quarterly report endpoint.
    Returns:
    dict: report contain price stats
    """
    with open('data.json') as meds:
        data = json.load(meds)

    prices = [med["price"] for med in data["medicines"] if med.get("price") is not None]

    # In case no data available
    if not prices:
        return {
            "report": {
                "status": "no_data",
                "message": "No medicine data available"
            }
        }

    # stat
    sorted_prices = sorted(prices)
    total_medicines = len(prices)
    avg_price = sum(prices) / total_medicines
    median_price = (sorted_prices[total_medicines // 2] if total_medicines % 2 != 0
                    else (sorted_prices[total_medicines // 2 - 1] + sorted_prices[total_medicines // 2]) / 2)

    # Price distribution
    price_ranges = {
        "low": len([p for p in prices if p <= avg_price * 0.5]),
        "medium": len([p for p in prices if avg_price * 0.5 < p <= avg_price * 1.5]),
        "high": len([p for p in prices if p > avg_price * 1.5])
    }

    report = {
        "average_price": round(avg_price, 2),
        "total_medicines": total_medicines,
        "median_price": round(median_price, 2),
        "min_price": round(min(prices), 2),
        "max_price": round(max(prices), 2),
        "analysis": {
            "price_distribution": price_ranges,
            "price_variance": round(sum((p - avg_price) ** 2 for p in prices) / total_medicines, 2)
        },
        "status": "success"
    }

    return {"report": report}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)