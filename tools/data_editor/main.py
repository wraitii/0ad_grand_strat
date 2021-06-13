import os

from flask import Flask
from flask import request

from ..config import *

from ..common.province import *

app = Flask(__name__)

HEAD = """<!DOCTYPE html><html>"""
FOOT = """</html>"""

def ornil(x, a, nil):
    return x[a] if a in x else nil

@app.route("/")
def show_provinces():
    load_provinces()

    ret = HEAD + open("tools/data_editor/header.html", "r").read()
    ret += "<body>"
    ret += "<table>"
    ret += "<tr><th class='id'>Code</th><th class='name'>Name</th><th class='mapTypes'>Map Types</th><th class='civs'>Civs</th></tr>"
    tt = sorted(provinces.keys())
    for prov in tt:
        pv = provinces[prov]
        ret += f"<tr class='province' id='{prov}'><td class='id' contenteditable='true'>{prov}</td>"
        ret += f"<td class='name' contenteditable='true'>{pv.history['name'] if 'name' in pv.history else prov.capitalize()}</td>"
        ret += f"<td class='mapTypes' contenteditable='true'>{', '.join(ornil(pv.history, 'mapTypes', []))}</td>"
        ret += f"<td class='civs' contenteditable='true'>{', '.join(ornil(pv.history, 'civs', []))}</td>"
        ret += "</tr>"
    ret += "</table>"
    ret += "<p class='button'><a id='update'>Update</a></p>"
    ret += """<script type="text/javascript" src="interactivity.js"></script>"""
    ret += "</body>"
    ret += FOOT
    return ret


@app.route("/interactivity.js")
def js_script():
    return open("tools/data_editor/interactivity.js", "r").read()

@app.route("/update", methods=["POST"])
def update():
    for item in request.json:
        data = json.load(open(PATH_TO_HISTORY + item["og_code"] + ".json", "r"))
        if item["code"] != item["og_code"]:
            # Renaming.
            data["code"] = item["code"]
            os.rename(PATH_TO_HISTORY + item["og_code"] + ".json", PATH_TO_HISTORY + item["code"] + ".json")
            os.rename(PATH_TO_ART + item["og_code"] + ".json", PATH_TO_ART + item["code"] + ".json")
            os.rename(PATH_TO_ART + item["og_code"] + ".png", PATH_TO_ART + item["code"] + ".png")
            for prov in provinces:
                pv = provinces[prov]
                try:
                    if item["og_code"] in pv.history["links"]:
                        pv.del_link(item["og_code"])
                        pv.add_link(item["code"])
                    pv.save({})
                except Exception as e:
                    print(e)
                    pass
        data["name"] = item["name"]
        try:
            data["mapTypes"] = [x.strip() for x in item["mapTypes"].split(",") if len(x.strip()) > 0]
        except Exception as err:
            print("Error parsing mapTypes " + str(err))
            pass
        try:
            data["civs"] = [x.strip() for x in item["civs"].split(",") if len(x.strip()) > 0]
        except Exception as err:
            print("Error parsing civs " + str(err))
            pass
        open(PATH_TO_HISTORY + item["code"] + ".json", "w").write(json.dumps(data))

    return {}
