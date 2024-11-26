from flask import Flask, render_template
import json
import os
data_location = "./static"

project_data = json.load(open(f"{data_location}/data.json"))
project_data = dict(sorted(project_data.items()))

for key in project_data.keys():
    images = []
    videos = []
    
    for file in os.listdir(f"{data_location}/projects/{key}"):
        if ".png" in file or ".jpg" in file:
            images.append(f"{data_location}/projects/{key}/{file}")
        if ".mp4" in file:
            videos.append(f"{data_location}/projects/{key}/{file}")
    
    project_data[key]["images"] = images
    project_data[key]["videos"] = videos

print(project_data)

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html", project_data=project_data)

@app.route("/imprint_data.html")
def imprint_data():
    return render_template("imprint_data.html")

if __name__ == "__main__":
    app.run(debug = True)