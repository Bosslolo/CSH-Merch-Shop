#!/usr/bin/env python3
"""Generate assets/fotoshooting-index.json from visual analysis of all 204 files."""
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "Fotoshooting Schülerfirma"
OUT = ROOT / "assets" / "fotoshooting-index.json"
NAMED = BASE / "_named"

COLOR_MAP = {
    "navy": "blau", "black": "schwarz", "white": "weiss",
    "grey": "grau", "gray": "grau",
}


def norm(name: str, ext: str) -> str:
    n = name.lower().replace("t-shirt", "tshirt")
    for eng, de in COLOR_MAP.items():
        n = re.sub(rf"\b{eng}\b", de, n)
    n = re.sub(r"-+", "-", n).strip("-")
    if not n.endswith(ext.lower()):
        n = re.sub(r"\.(jpe?g|png)$", "", n, flags=re.I) + ext.lower()
    return n


def e(folder, original, proposed, description, product=None, tags=None, shop=False):
    ext = Path(original).suffix
    return {
        "folder": folder,
        "original": original,
        "proposed_name": norm(proposed, ext),
        "description": description,
        "product": product,
        "tags": tags or [],
        "shop_curated": shop,
    }


ENTRIES = []

# fmt: off
# --- SHOOTING 1 (38) — early studio, black hoodie + black tee only ---
S1 = [
  ("DSC02070.jpg", "hoodie-schwarz-front-studio-female-01.jpg", "Female model, black hoodie front CSH logo, studio", "hoodie-schwarz"),
  ("DSC02071.jpg", "hoodie-schwarz-front-studio-female-02.jpg", "Female model, black hoodie front, looking away, studio", "hoodie-schwarz"),
  ("DSC02104.jpg", "combo-hoodie-tshirt-schwarz-front-back-studio-01.jpg", "Hoodie front + t-shirt back with building print, studio", "hoodie-schwarz|tshirt-schwarz"),
  ("DSC02110.jpg", "hoodie-schwarz-front-studio-male-01.jpg", "Smiling male, black hoodie front CSH logo, studio", "hoodie-schwarz", True),
  ("DSC02152.jpg", "hoodie-schwarz-back-building-print-studio-hood-up-01.jpg", "Black hoodie back, building print, hood up", "hoodie-schwarz"),
  ("DSC02195.jpg", "hoodie-schwarz-back-building-print-studio-01.jpg", "Black hoodie back, school building line art, studio", "hoodie-schwarz", True),
  ("DSC02198.jpg", "tshirt-schwarz-front-studio-female-01.jpg", "Female model, black t-shirt front CSH logo", "tshirt-schwarz"),
  ("DSC02204.jpg", "tshirt-schwarz-front-studio-female-02.jpg", "Female pulling t-shirt hem, CSH logo", "tshirt-schwarz"),
  ("DSC02210.jpg", "tshirt-schwarz-front-studio-female-03.jpg", "Female black t-shirt front, studio", "tshirt-schwarz"),
  ("DSC02212.jpg", "tshirt-schwarz-front-studio-female-04.jpg", "Female facing camera, black t-shirt", "tshirt-schwarz"),
  ("DSC02213.jpg", "tshirt-schwarz-front-studio-female-05.jpg", "Female neutral pose, black t-shirt CSH logo", "tshirt-schwarz"),
  ("DSC02214.jpg", "tshirt-schwarz-front-studio-female-06.jpg", "Female direct gaze, black t-shirt", "tshirt-schwarz"),
  ("DSC02220.jpg", "tshirt-schwarz-front-studio-female-07.jpg", "Female pulling hem, black t-shirt", "tshirt-schwarz"),
  ("DSC02222.jpg", "tshirt-schwarz-front-studio-female-08.jpg", "Female looking down, black t-shirt", "tshirt-schwarz"),
  ("DSC02248.jpg", "tshirt-schwarz-front-studio-female-09.jpg", "Female with nose ring, black t-shirt CSH logo", "tshirt-schwarz"),
  ("DSC02252.jpg", "tshirt-schwarz-front-studio-female-10.jpg", "Female profile, black t-shirt CSH logo", "tshirt-schwarz", True),
  ("DSC02270.jpg", "tshirt-schwarz-front-studio-female-11.jpg", "Female ponytail, black t-shirt front", "tshirt-schwarz"),
  ("DSC02275.jpg", "tshirt-schwarz-front-studio-female-12.jpg", "Female hands behind back, black t-shirt", "tshirt-schwarz"),
  ("DSC02280.jpg", "tshirt-schwarz-back-building-print-studio-01.jpg", "Black t-shirt back, building print", "tshirt-schwarz"),
  ("DSC02315.jpg", "tshirt-schwarz-back-building-print-studio-02.jpg", "Black t-shirt back, Hegau text", "tshirt-schwarz"),
  ("DSC02337.jpg", "combo-hoodie-tshirt-schwarz-front-back-studio-duo-01.jpg", "Male hoodie front + female t-shirt back", "hoodie-schwarz|tshirt-schwarz"),
  ("DSC02338.jpg", "hoodie-schwarz-detail-logo-studio-male-01.jpg", "Close-up CSH logo on black hoodie", "hoodie-schwarz"),
  ("DSC02340.jpg", "hoodie-schwarz-detail-logo-studio-macro-01.jpg", "Macro CSH logo on black hoodie knit", "hoodie-schwarz"),
  ("DSC02347.jpg", "tshirt-schwarz-detail-logo-lifestyle-01.jpg", "Close-up CSH logo on black t-shirt", "tshirt-schwarz"),
  ("DSC02351.jpg", "hoodie-schwarz-front-studio-male-02.jpg", "Male hands in pockets, black hoodie", "hoodie-schwarz"),
  ("DSC02362.jpg", "hoodie-schwarz-front-studio-male-03.jpg", "Male smiling, black hoodie front", "hoodie-schwarz"),
  ("DSC02369.jpg", "combo-hoodie-tshirt-schwarz-front-studio-duo-01.jpg", "Duo both showing front CSH logos", "hoodie-schwarz|tshirt-schwarz"),
  ("DSC02371.jpg", "combo-hoodie-tshirt-schwarz-front-studio-duo-02.jpg", "Duo side by side, front logos", "hoodie-schwarz|tshirt-schwarz"),
  ("DSC02384.jpg", "tshirt-schwarz-front-studio-female-13.jpg", "Female t-shirt front, partial hoodie at edge", "tshirt-schwarz"),
  ("DSC02396.jpg", "combo-hoodie-tshirt-schwarz-detail-logo-lifestyle-01.jpg", "Lifestyle close-up hoodie + t-shirt logos", "hoodie-schwarz|tshirt-schwarz"),
  ("DSC02402.jpg", "tshirt-schwarz-detail-logo-studio-01.jpg", "Studio detail CSH logo on t-shirt", "tshirt-schwarz"),
  ("DSC02428.jpg", "hoodie-schwarz-detail-logo-studio-macro-02.jpg", "Extreme macro CSH logo on hoodie", "hoodie-schwarz"),
  ("DSC02443-2.jpg", "combo-hoodie-tshirt-schwarz-back-building-print-lifestyle-bw-01.jpg", "B&W hallway, back prints on both", "hoodie-schwarz|tshirt-schwarz"),
  ("DSC02443.jpg", "combo-hoodie-tshirt-schwarz-back-building-print-lifestyle-01.jpg", "Hallway walk, back building prints", "hoodie-schwarz|tshirt-schwarz"),
  ("DSC02465.jpg", "hoodie-schwarz-back-building-print-lifestyle-male-01.jpg", "Male back view in hallway", "hoodie-schwarz"),
  ("DSC02478.jpg", "hoodie-schwarz-front-lifestyle-male-hallway-01.jpg", "Male hallway, black hoodie front", "hoodie-schwarz"),
  ("DSC02486.jpg", "tshirt-schwarz-front-lifestyle-female-hallway-01.jpg", "Female walking hallway, black t-shirt", "tshirt-schwarz"),
  ("DSC02487.jpg", "tshirt-schwarz-front-lifestyle-female-hallway-02.jpg", "Female candid hallway, black t-shirt", "tshirt-schwarz"),
]
for row in S1:
    shop = row[4] if len(row) > 4 else False
    ENTRIES.append(e("Shooting 1", row[0], row[1], row[2], row[3], shop=shop))

# --- SHOOTING 2 part 1 (56) ---
S2A = [
  ("CSH_white.png", "brand-logo-weiss-front.png", "CSH circular logo white on black, slogan LERNE LERNEN", None, True),
  ("DSC02516.jpg", "ref-hoodie-grau-front-lifestyle-outdoor-01.jpg", "Non-merch grey hoodie, outdoor lifestyle (no CSH logo)", None),
  ("DSC02522.jpg", "ref-hoodie-grau-front-lifestyle-outdoor-marker-01.jpg", "Non-merch grey hoodie, pointing marker outdoors", None),
  ("DSC02588.jpg", "hoodie-blau-front-lifestyle-portrait-male-01.jpg", "Navy hoodie CSH logo, close portrait", "hoodie-blau"),
  ("DSC02596.jpg", "hoodie-blau-front-studio-male-01.jpg", "Navy CSH hoodie, male waist-up studio", "hoodie-blau"),
  ("DSC02613.jpg", "hoodie-blau-detail-logo-studio-01.jpg", "Close-up CSH logo on navy hoodie fabric", "hoodie-blau", True),
  ("DSC02623.jpg", "hoodie-blau-front-studio-male-02.jpg", "Male pulling hoodie hem, navy CSH logo", "hoodie-blau", True),
  ("DSC02634.jpg", "hoodie-weiss-front-studio-female-01.jpg", "Female white CSH hoodie, studio", "hoodie-weiss"),
  ("DSC02639.jpg", "hoodie-weiss-front-studio-female-02.jpg", "Female white hoodie, hand in pocket", "hoodie-weiss", True),
  ("DSC02648.jpg", "hoodie-weiss-front-studio-female-03.jpg", "Female white hoodie, direct gaze", "hoodie-weiss"),
  ("DSC02656.jpg", "hoodie-weiss-back-building-print-studio-01.jpg", "White hoodie back, building print", "hoodie-weiss"),
  ("DSC02678.jpg", "combo-hoodie-blau-weiss-front-studio-duo-01.jpg", "Navy + white hoodies front, studio duo", "hoodie-blau|hoodie-weiss"),
  ("DSC02741.jpg", "ref-sweater-grau-front-lifestyle-indoor-01.jpg", "Non-merch grey knit sweater, art room", None),
  ("DSC02747.jpg", "hoodie-schwarz-front-studio-male-04.jpg", "Male black CSH hoodie, hands in pockets", "hoodie-schwarz"),
  ("DSC02767.jpg", "hoodie-schwarz-front-studio-male-05.jpg", "Male black hoodie smiling off-camera", "hoodie-schwarz"),
  ("DSC02814.jpg", "hoodie-schwarz-back-building-print-studio-02.jpg", "Male back, black hoodie building print", "hoodie-schwarz"),
  ("DSC02839.jpg", "hoodie-schwarz-front-studio-male-06.jpg", "Male black hoodie, arms behind back", "hoodie-schwarz"),
  ("DSC02841.jpg", "hoodie-schwarz-front-studio-male-profile-01.jpg", "Male black hoodie, three-quarter profile", "hoodie-schwarz"),
  ("DSC02881.jpg", "combo-hoodie-blau-weiss-schwarz-front-studio-group-01.jpg", "Three hoodies navy/white/black front", "multi"),
  ("DSC02894.jpg", "combo-hoodie-blau-weiss-schwarz-front-studio-group-02.jpg", "Three hoodies mid-thigh group", "multi"),
  ("DSC02907.jpg", "combo-hoodie-blau-weiss-schwarz-front-studio-group-03.jpg", "Three hoodies three-quarter length", "multi"),
  ("DSC02913.jpg", "combo-hoodie-blau-weiss-schwarz-front-studio-group-fullbody-01.jpg", "Three hoodies full-body front", "multi"),
  ("DSC02936.jpg", "combo-hoodie-blau-weiss-schwarz-front-studio-group-interaction-01.jpg", "Three hoodies interacting candid", "multi"),
  ("DSC02952.jpg", "combo-hoodie-blau-weiss-schwarz-front-studio-group-04.jpg", "Three hoodies medium-full group", "multi"),
  ("DSC02953.jpg", "combo-hoodie-blau-weiss-schwarz-front-studio-group-highangle-01.jpg", "High-angle three hoodies full-body", "multi"),
  ("DSC02964.jpg", "combo-hoodie-blau-weiss-schwarz-front-studio-group-waistup-01.jpg", "Waist-up three hoodies", "multi"),
  ("DSC02975.jpg", "combo-hoodie-blau-weiss-schwarz-back-studio-group-fullbody-01.jpg", "Three hoodies back, building prints", "multi"),
  ("DSC02979.jpg", "combo-hoodie-blau-weiss-schwarz-back-studio-group-posed-01.jpg", "Back group arms on shoulders", "multi"),
  ("DSC02983.jpg", "combo-hoodie-blau-weiss-schwarz-back-studio-group-posed-02.jpg", "Back group posed camaraderie", "multi"),
  ("DSC02994.jpg", "combo-hoodie-blau-weiss-schwarz-back-studio-group-posed-03.jpg", "Back group arms draped", "multi"),
  ("DSC02995.jpg", "combo-hoodie-blau-weiss-schwarz-back-studio-group-posed-04.jpg", "Back group Hegau illustration", "multi"),
  ("DSC02999.jpg", "combo-hoodie-blau-weiss-schwarz-back-studio-group-posed-05.jpg", "Back group arms on shoulders", "multi"),
  ("DSC03004.jpg", "combo-hoodie-blau-weiss-schwarz-back-studio-group-posed-06.jpg", "Back group three hoodies posed", "multi"),
  ("DSC03016.jpg", "tshirt-weiss-front-lifestyle-male-indoor-01.jpg", "Male white CSH t-shirt, blurred indoor", "tshirt-weiss"),
  ("DSC03050.jpg", "tshirt-weiss-front-studio-group-01.jpg", "Three white CSH t-shirts tucked in", "tshirt-weiss"),
  ("DSC03066.jpg", "tshirt-weiss-front-studio-group-02.jpg", "Three white t-shirts waist-up", "tshirt-weiss"),
  ("DSC03067.jpg", "tshirt-weiss-front-studio-group-03.jpg", "Three white t-shirts mixed tuck", "tshirt-weiss"),
  ("DSC03070.jpg", "tshirt-weiss-front-studio-group-04.jpg", "Three white t-shirts hands in pockets", "tshirt-weiss"),
  ("DSC03071.jpg", "tshirt-weiss-front-studio-group-05.jpg", "Three white t-shirts serious expressions", "tshirt-weiss"),
  ("DSC03073.jpg", "tshirt-weiss-front-studio-group-06.jpg", "Three white t-shirts promotional", "tshirt-weiss"),
  ("DSC03089.jpg", "tshirt-weiss-back-studio-group-01.jpg", "Three white t-shirts back building print", "tshirt-weiss"),
  ("DSC03091.jpg", "tshirt-weiss-back-studio-male-01.jpg", "Male white t-shirt back building print", "tshirt-weiss"),
  ("DSC03093.jpg", "tshirt-weiss-back-studio-male-arms-crossed-01.jpg", "Male white t-shirt back, arms crossed", "tshirt-weiss"),
  ("DSC03094.jpg", "combo-tshirt-weiss-front-back-studio-group-01.jpg", "Center front logo, sides back print", "tshirt-weiss"),
  ("DSC03109.jpg", "combo-tshirt-weiss-front-back-studio-group-02.jpg", "Front/back combo group studio", "tshirt-weiss"),
  ("DSC03116.jpg", "combo-tshirt-weiss-front-back-studio-group-laugh-01.jpg", "Group laughing, front/back combo", "tshirt-weiss"),
  ("DSC03123.jpg", "combo-tshirt-weiss-front-back-studio-group-03.jpg", "Three models front/back combo", "tshirt-weiss"),
  ("DSC03124.jpg", "combo-tshirt-weiss-front-back-studio-group-04.jpg", "Female front, males back print", "tshirt-weiss"),
  ("DSC03125.jpg", "combo-tshirt-weiss-front-back-studio-group-05.jpg", "White t-shirt front and back designs", "tshirt-weiss"),
  ("DSC03129.jpg", "combo-tshirt-weiss-front-back-lifestyle-group-smile-01.jpg", "Smiling center front, flanks back", "tshirt-weiss"),
  ("DSC03134.jpg", "combo-tshirt-weiss-front-back-studio-group-06.jpg", "Three models front/back studio", "tshirt-weiss"),
  ("DSC03146.jpg", "combo-tshirt-weiss-front-back-studio-duo-01.jpg", "Male back + female front duo", "tshirt-weiss"),
  ("DSC03155.jpg", "combo-tshirt-weiss-front-back-studio-duo-02.jpg", "Female front + male back duo", "tshirt-weiss"),
  ("DSC03165.jpg", "tshirt-weiss-front-studio-male-01.jpg", "Male white CSH t-shirt three-quarter", "tshirt-weiss"),
  ("DSC03171.jpg", "tshirt-weiss-back-studio-male-02.jpg", "Male white t-shirt back gripping hem", "tshirt-weiss"),
  ("DSC03177.jpg", "tshirt-weiss-back-studio-male-03.jpg", "Full back white t-shirt building print", "tshirt-weiss"),
  ("DSC03182.jpg", "tshirt-weiss-front-studio-male-02.jpg", "Male white t-shirt hands in pockets", "tshirt-weiss"),
  ("DSC03208.jpg", "tshirt-weiss-front-studio-male-smile-01.jpg", "Smiling male white CSH t-shirt", "tshirt-weiss", True),
]
for row in S2A:
    shop = row[4] if len(row) > 4 else False
    ENTRIES.append(e("Shooting 2", row[0], row[1], row[2], row[3] if len(row) > 3 else None, shop=shop))

# --- SHOOTING 2 part 2 (67) ---
S2B = [
  ("DSC03210.jpg", "tshirt-weiss-front-studio-male-smile-02.jpg", "Male smiling white CSH t-shirt", "tshirt-weiss"),
  ("DSC03219.jpg", "tshirt-weiss-front-studio-male-neutral-01.jpg", "Male neutral white CSH t-shirt", "tshirt-weiss"),
  ("DSC03226.jpg", "tshirt-weiss-back-building-print-studio-male-01.jpg", "Male back white t-shirt building print", "tshirt-weiss"),
  ("DSC03235.jpg", "hoodie-weiss-back-building-print-studio-02.jpg", "White hoodie back, partial second model", "hoodie-weiss"),
  ("DSC03266.jpg", "tshirt-weiss-front-studio-female-01.jpg", "Female white CSH t-shirt, gold jewelry", "tshirt-weiss"),
  ("DSC03271.jpg", "tshirt-weiss-front-studio-female-02.jpg", "Female white t-shirt, hair pulled back", "tshirt-weiss"),
  ("DSC03279.jpg", "tshirt-weiss-front-studio-female-03.jpg", "Female white t-shirt, sleek bun", "tshirt-weiss"),
  ("DSC03314.jpg", "combo-tshirt-hoodie-weiss-front-back-studio-duo-01.jpg", "T-shirt back + hoodie front duo", "tshirt-weiss|hoodie-weiss"),
  ("DSC03315.jpg", "combo-tshirt-hoodie-weiss-front-back-studio-duo-02.jpg", "T-shirt back + hoodie front duo alt", "tshirt-weiss|hoodie-weiss"),
  ("DSC03316.jpg", "combo-tshirt-hoodie-weiss-front-back-hood-up-studio-01.jpg", "T-shirt front + hoodie back hood up", "tshirt-weiss|hoodie-weiss"),
  ("DSC03329.jpg", "combo-tshirt-hoodie-weiss-front-back-studio-duo-03.jpg", "T-shirt front + hoodie back duo", "tshirt-weiss|hoodie-weiss"),
  ("DSC03330.jpg", "combo-tshirt-hoodie-weiss-front-back-studio-duo-fullbody-01.jpg", "Full-body t-shirt/hoodie duo", "tshirt-weiss|hoodie-weiss"),
  ("DSC03335.jpg", "tshirt-weiss-front-lifestyle-male-phone-indoor-01.jpg", "Male seated with phone, white CSH t-shirt", "tshirt-weiss"),
  ("DSC03342.jpg", "tshirt-weiss-front-lifestyle-male-chair-indoor-01.jpg", "Male lounging in chair, white t-shirt", "tshirt-weiss"),
  ("DSC03361.jpg", "tshirt-schwarz-front-studio-group-carry-fun-01.jpg", "Three black t-shirts playful carry pose", "tshirt-schwarz"),
  ("DSC03376.jpg", "tshirt-schwarz-front-studio-group-carry-fun-02.jpg", "Group carry pose black t-shirts", "tshirt-schwarz"),
  ("DSC03398.jpg", "tshirt-schwarz-front-studio-female-14.jpg", "Female black t-shirt, hands on belt", "tshirt-schwarz"),
  ("DSC03419.jpg", "tshirt-schwarz-front-studio-group-three-01.jpg", "Three models black CSH t-shirts waist-up", "tshirt-schwarz", True),
  ("DSC03424.jpg", "tshirt-schwarz-front-studio-group-three-fullbody-01.jpg", "Full-body group three black t-shirts", "tshirt-schwarz"),
  ("DSC03449.jpg", "hoodie-schwarz-front-studio-female-smile-01.jpg", "Blonde woman smiling, black CSH hoodie", "hoodie-schwarz"),
  ("DSC03452.jpg", "hoodie-schwarz-front-studio-female-clasped-01.jpg", "Blonde woman clasped hands, black hoodie", "hoodie-schwarz"),
  ("DSC03468.jpg", "hoodie-schwarz-front-studio-female-laughing-01.jpg", "Blonde woman laughing, black CSH hoodie", "hoodie-schwarz", True),
  ("DSC03493.jpg", "combo-hoodie-tshirt-multi-front-studio-group-four-01.jpg", "Four models all CSH hoodie/t-shirt colors", "multi"),
  ("DSC03495.jpg", "combo-hoodie-tshirt-schwarz-weiss-front-studio-duo-fullbody-01.jpg", "Black t-shirt + white hoodie duo", "tshirt-schwarz|hoodie-weiss"),
  ("DSC03505.jpg", "combo-hoodie-tshirt-multi-front-studio-group-four-02.jpg", "Four models inverted logo colors", "multi"),
  ("DSC03508.jpg", "combo-hoodie-tshirt-multi-front-studio-group-four-03.jpg", "Four models adult + students", "multi"),
  ("DSC03528.jpg", "combo-hoodie-tshirt-multi-front-studio-group-four-04.jpg", "Four models alternating black/white", "multi"),
  ("DSC03545.jpg", "combo-hoodie-tshirt-weiss-schwarz-front-studio-duo-fullbody-01.jpg", "White hoodie + black t-shirt duo", "hoodie-weiss|tshirt-schwarz"),
  ("DSC03584.jpg", "combo-hoodie-weiss-schwarz-back-outdoor-snow-group-01.jpg", "Four hoodies back, snowy shelter", "multi"),
  ("DSC03585.jpg", "combo-hoodie-weiss-schwarz-back-outdoor-snow-walking-01.jpg", "Four hoodies walking arm-in-arm snow", "multi"),
  ("DSC03601.jpg", "combo-hoodie-weiss-schwarz-back-outdoor-snow-highangle-01.jpg", "High-angle snow walk, hoodies back", "multi"),
  ("DSC03630.jpg", "hoodie-weiss-front-lifestyle-outdoor-female-01.jpg", "Female white hoodie, snowy outdoor blur", "hoodie-weiss"),
  ("DSC03636.jpg", "hoodie-weiss-front-lifestyle-outdoor-female-02.jpg", "Female white hoodie looking off-camera", "hoodie-weiss"),
  ("DSC03647.jpg", "combo-hoodie-blau-weiss-front-outdoor-couple-01.jpg", "Navy + white hoodie couple outdoors", "hoodie-blau|hoodie-weiss"),
  ("DSC03649.jpg", "hoodie-schwarz-front-lifestyle-outdoor-male-snow-01.jpg", "Male black hoodie snowy outdoor", "hoodie-schwarz"),
  ("DSC03651.jpg", "hoodie-weiss-front-lifestyle-outdoor-female-smile-01.jpg", "Female smiling white hoodie outdoors", "hoodie-weiss"),
  ("DSC03661.jpg", "hoodie-weiss-front-lifestyle-outdoor-female-laugh-01.jpg", "Female laughing hands on hips, white hoodie", "hoodie-weiss"),
  ("DSC03675.jpg", "hoodie-schwarz-front-lifestyle-outdoor-male-pockets-01.jpg", "Male black hoodie outdoor pockets", "hoodie-schwarz"),
  ("DSC03683.jpg", "hoodie-weiss-front-lifestyle-outdoor-female-03.jpg", "Female white hoodie outdoor portrait", "hoodie-weiss"),
  ("DSC03692.jpg", "hoodie-blau-front-lifestyle-outdoor-male-hood-hold-01.jpg", "Male holding hood edges, navy hoodie snow", "hoodie-blau"),
  ("DSC03696.jpg", "hoodie-blau-front-lifestyle-outdoor-male-pocket-01.jpg", "Male navy hoodie kangaroo pocket outdoor", "hoodie-blau"),
  ("DSC03708.jpg", "hoodie-schwarz-back-building-print-outdoor-snow-01.jpg", "Black hoodie back snow field", "hoodie-schwarz"),
  ("DSC03735.jpg", "hoodie-schwarz-front-lifestyle-outdoor-snowball-01.jpg", "Male throwing snowball, black hoodie", "hoodie-schwarz"),
  ("DSC03770.jpg", "hoodie-blau-back-building-print-outdoor-snow-walking-01.jpg", "Navy hoodie back walking in snow", "hoodie-blau"),
  ("DSC03780.jpg", "hoodie-weiss-back-building-print-outdoor-snow-walking-01.jpg", "White hoodie back walking snow", "hoodie-weiss"),
  ("DSC03793.jpg", "hoodie-schwarz-back-building-print-outdoor-snow-ledge-01.jpg", "Black hoodie back on snowy ledge", "hoodie-schwarz"),
  ("DSC03815.jpg", "hoodie-weiss-side-lifestyle-outdoor-duo-01.jpg", "Female white hoodie side view, duo blur", "hoodie-weiss"),
  ("DSC03818.jpg", "hoodie-weiss-back-building-print-outdoor-closeup-01.jpg", "Close-up white hoodie back print snow", "hoodie-weiss"),
  ("DSC03825.jpg", "hoodie-weiss-back-building-print-outdoor-female-01.jpg", "Female white hoodie back snowy outdoor", "hoodie-weiss"),
  ("DSC03831.jpg", "hoodie-weiss-back-building-print-outdoor-hood-up-01.jpg", "White hoodie back hood up snow", "hoodie-weiss"),
  ("DSC03856.jpg", "combo-hoodie-blau-weiss-schwarz-back-outdoor-snow-jumping-01.jpg", "Three hoodies jumping off snowy ledge", "multi"),
  ("DSC03895.jpg", "hoodie-schwarz-detail-logo-outdoor-snow-action-01.jpg", "Close-up black CSH logo, snow motion blur", "hoodie-schwarz"),
  ("DSC03907.jpg", "hoodie-weiss-detail-logo-closeup-01.jpg", "Macro white hoodie CSH logo drawstrings", "hoodie-weiss"),
  ("DSC03942.jpg", "combo-hoodie-schwarz-weiss-back-outdoor-campus-walking-01.jpg", "Two hoodies walking campus path back", "hoodie-schwarz|hoodie-weiss"),
  ("DSC03945.jpg", "hoodie-schwarz-back-building-print-outdoor-campus-fullbody-01.jpg", "Full-body back black hoodie campus walk", "hoodie-schwarz"),
  ("DSC03975.jpg", "hoodie-blau-front-lifestyle-outdoor-campus-fullbody-01.jpg", "Full-body navy hoodie front campus", "hoodie-blau"),
  ("DSC03988.jpg", "hoodie-blau-back-building-print-outdoor-campus-fullbody-01.jpg", "Full-body navy hoodie back campus", "hoodie-blau"),
  ("DSC03999.jpg", "hoodie-schwarz-front-lifestyle-outdoor-campus-fullbody-01.jpg", "Full-body black hoodie front campus", "hoodie-schwarz"),
  ("DSC04016.jpg", "hoodie-schwarz-back-building-print-outdoor-campus-fullbody-01.jpg", "Full-body black hoodie back campus", "hoodie-schwarz"),
  ("DSC04038.jpg", "hoodie-weiss-front-lifestyle-outdoor-campus-fullbody-01.jpg", "Full-body white hoodie front campus snow", "hoodie-weiss"),
  ("DSC04055.jpg", "hoodie-weiss-back-building-print-outdoor-campus-fullbody-01.jpg", "Full-body white hoodie back campus", "hoodie-weiss"),
  ("DSC04073.jpg", "hoodie-weiss-front-lifestyle-outdoor-campus-fullbody-02.jpg", "Female white hoodie campus courtyard", "hoodie-weiss"),
  ("DSC04104.jpg", "hoodie-weiss-back-building-print-outdoor-campus-hood-adjust-01.jpg", "Female adjusting hood, white back print", "hoodie-weiss"),
  ("DSC04115.jpg", "combo-hoodie-weiss-back-outdoor-campus-walking-duo-01.jpg", "Two females walking white hoodies back", "hoodie-weiss"),
  ("DSC04184.jpg", "ref-styling-jeans-sneaker-detail-01.jpg", "Ed Hardy jeans + Nike Dunk detail (not merch)", None),
]
for row in S2B:
    shop = row[4] if len(row) > 4 else False
    ENTRIES.append(e("Shooting 2", row[0], row[1], row[2], row[3], shop=shop))

# --- SHOOTING 3 (32) ---
S3 = [
  ("0D7D6328-E1B6-497B-BFC7-4A424E40C490.JPG", "lifestyle-courtyard-deck-hoodie-tshirt-back-outdoor-01.jpg", "Three on wooden deck, back prints", "multi"),
  ("149B2C7C-9E0B-4D88-95DA-35B2A115FD40.JPG", "lifestyle-campus-overhang-hoodie-group-outdoor-01.jpg", "Three under building overhang, hoodies", "multi"),
  ("1531A501-03F8-469C-9254-C167E93844E5.JPG", "lifestyle-field-tshirt-back-walking-outdoor-01.jpg", "Three walking field, t-shirt back prints", "tshirt-schwarz|tshirt-weiss"),
  ("1D82DA16-084B-4F71-8ABF-87176B2BE692.JPG", "lifestyle-wooden-wall-hoodie-duo-outdoor-01.jpg", "Boy white + girl black hoodie at wood wall", "hoodie-weiss|hoodie-schwarz"),
  ("2102B720-B26B-47C0-B65D-85087DE1808C.JPG", "lifestyle-beam-hoodie-group-front-outdoor-01.jpg", "Five on wooden beam, navy/black/white hoodies", "multi"),
  ("2BF659AD-F334-4C9C-805F-F3A4EF3BDFC7.JPG", "lifestyle-baseball-field-tshirt-catching-outdoor-01.jpg", "Boy catching baseball, black CSH t-shirt", "tshirt-schwarz"),
  ("34931596-78D8-4EC5-81C7-94074588E2E9.JPG", "lifestyle-courtyard-hoodie-back-front-outdoor-01.jpg", "Black hoodie back + white hoodie front courtyard", "hoodie-schwarz|hoodie-weiss", True),
  ("3CEF4077-342C-4D5A-B3C8-DD959457886E.JPG", "lifestyle-hallway-hoodie-tshirt-back-indoor-01.jpg", "Hallway walk back prints hoodie+t-shirt", "multi"),
  ("41B7CD8A-23A2-41E2-A3AA-FFFE2FB28318.JPG", "lifestyle-stairs-hoodie-christmas-indoor-group-01.jpg", "Santa hats on stairs, black/white hoodies", "multi"),
  ("47DE69C6-E083-40EA-B829-44E99297C5FC.JPG", "lifestyle-beam-hoodie-back-group-outdoor-01.jpg", "Five on beam looking back, hoodies", "multi"),
  ("4D15BC29-7CF9-4095-AB4B-3918F7283C15.JPG", "lifestyle-park-hoodie-weiss-front-outdoor-smile-01.jpg", "Male smiling white CSH hoodie in park", "hoodie-weiss"),
  ("58CC2B65-CE6D-4CD7-A558-0B3B3113DD09.JPG", "lifestyle-stairs-hoodie-tshirt-christmas-indoor-02.jpg", "Six on stairs Santa hats mixed merch", "multi"),
  ("5C5906A7-4D95-43C0-9CEE-2EA910AE9ECD.JPG", "lifestyle-baseball-field-tshirt-weiss-catching-outdoor-01.jpg", "Boy catching baseball white t-shirt back", "tshirt-weiss"),
  ("65242502-89F1-4653-9FBB-87CC54818218.JPG", "ref-prop-tulips-table-indoor-01.jpg", "Tulips in vase on table — shoot prop only", None),
  ("7015AD98-F9AA-4865-8366-70CEAC0906E2.JPG", "lifestyle-wooden-wall-hoodie-group-outdoor-01.jpg", "Six on deck against slatted wall", "multi"),
  ("74615829-17DE-495D-BB1B-88C77D1E424B.JPG", "lifestyle-study-booth-hoodie-tshirt-indoor-01.jpg", "Green study booth three students", "multi"),
  ("7C1C4433-80F7-4456-93A0-55FB0B6E8A1A.JPG", "lifestyle-study-booth-hoodie-tshirt-indoor-02.jpg", "Study booth collaboration shot", "multi"),
  ("84D79A9F-DA7D-4744-B1EC-AEE28EDAD896.JPG", "lifestyle-stonewall-hoodie-back-goldenhour-outdoor-01.jpg", "Five on stone wall golden hour back prints", "multi"),
  ("99BAE4E4-BA99-4E54-BAC6-FEC4520B8C25.JPG", "lifestyle-field-tshirt-back-walking-outdoor-02.jpg", "Three walking field t-shirt backs", "tshirt-schwarz|tshirt-weiss"),
  ("9A97784E-5827-4407-8FD7-EA2CFC020D35.JPG", "lifestyle-courtyard-deck-handstand-tshirt-outdoor-01.jpg", "Handstand on deck white t-shirt", "tshirt-weiss"),
  ("9EECC2CF-8033-46CD-AB81-C18EC299571F.JPG", "lifestyle-pingpong-tshirt-group-outdoor-01.jpg", "Three on ping-pong table black/white tees", "tshirt-schwarz|tshirt-weiss"),
  ("A08488AB-B26B-47E9-919C-5AD66A11FC2C.JPG", "lifestyle-wooden-wall-hoodie-group-outdoor-02.jpg", "Six posing on wooden deck", "multi"),
  ("B406D1E0-62DD-4B05-ACDA-DA6F7B563A2A.JPG", "lifestyle-stonewall-hoodie-mixed-outdoor-01.jpg", "Five on stone ledge mixed front/back", "multi"),
  ("BAB15144-71DC-4A30-8A60-4CA225767353.JPG", "lifestyle-deck-table-studying-hoodie-tshirt-outdoor-01.jpg", "Three studying at outdoor wooden table", "multi"),
  ("C0F42A8C-BC66-46B4-A823-97096BAFECAC.JPG", "lifestyle-deck-table-studying-hoodie-back-outdoor-01.jpg", "Outdoor table study, black hoodie back", "multi"),
  ("CC072290-AE0C-405F-9C77-0C6FFA6CBBB3.JPG", "lifestyle-logs-tshirt-talking-outdoor-01.jpg", "Three on logs hillside black/white tees", "tshirt-schwarz|tshirt-weiss"),
  ("D28747A6-2F44-440A-8AF8-E2458D07B39A.JPG", "lifestyle-study-booth-hoodie-tshirt-indoor-03.jpg", "Study booth girl t-shirt back boys hoodies", "multi"),
  ("DC580CED-9987-467F-828B-0CC4A75A3EDE.JPG", "lifestyle-logbench-tshirt-scenic-outdoor-01.jpg", "Log bench overlooking fields, t-shirts", "tshirt-schwarz|tshirt-weiss"),
  ("E9A21697-3243-40A3-AB27-C97BFF37C24A.JPG", "lifestyle-bench-hoodie-back-whisper-outdoor-01.jpg", "Two girls bench navy/black hoodie backs", "hoodie-blau|hoodie-schwarz"),
  ("EA478945-97EA-414A-AED3-9BC2945CA01B.JPG", "lifestyle-wooden-wall-hoodie-group-outdoor-03.jpg", "Six lined up on wooden deck", "multi"),
  ("EB1080EF-3C7F-4949-BE29-D229C14FD919.JPG", "lifestyle-field-tshirt-back-walking-outdoor-03.jpg", "Three walking grassy hill t-shirt backs", "tshirt-schwarz|tshirt-weiss"),
  ("FC28DBA8-9885-429F-BD7B-1421140F290D.JPG", "lifestyle-floor-hoodie-tshirt-christmas-indoor-back-01.jpg", "Six on floor Santa hats back prints", "multi"),
]
for row in S3:
    shop = row[4] if len(row) > 4 else False
    ENTRIES.append(e("Shooting 3", row[0], row[1], row[2], row[3], shop=shop))

# --- BLANKED (11) ---
BL = [
  ("Bild 01.12.23 um 15.37.jpeg", "brand-building-sketch-lineart.jpeg", "Hand-drawn CSH school building line art", None),
  ("CSH-Front.jpeg", "ref-school-building-exterior-day.jpeg", "CSH Gemeindezentrum daytime exterior", None, True),
  ("CSH_white.png", "brand-logo-weiss.png", "CSH circular white logo asset", None, True),
  ("ChatGPT Image Jan 29, 2026, 11_53_54 AM.png", "ref-school-building-exterior-dusk-ai.png", "AI-generated school at dusk", None),
  ("SpringPicca.jpg", "ref-background-cherry-blossom-spring.jpg", "Cherry blossom spring background", None),
  ("WhatsApp Image 2023-11-24 at 15.55.15 (1).jpeg", "ref-mockup-tshirt-schwarz-back-building.jpeg", "Mockup black t-shirt back building print", "tshirt-schwarz"),
  ("WhatsApp Image 2023-11-24 at 15.55.15 (2).jpeg", "ref-mockup-tshirt-weiss-front-logo.jpeg", "Mockup white t-shirt front CSH logo", "tshirt-weiss"),
  ("WhatsApp Image 2023-11-24 at 15.55.15.jpeg", "ref-mockup-hoodie-schwarz-back-building.jpeg", "Mockup black hoodie back building print", "hoodie-schwarz"),
  ("WhatsApp Image 2023-11-24 at 15.55.16 (1).jpeg", "ref-mockup-tshirt-schwarz-front-logo.jpeg", "Mockup black t-shirt front CSH logo", "tshirt-schwarz"),
  ("WhatsApp Image 2023-11-24 at 15.55.16.jpeg", "ref-mockup-tshirt-weiss-back-building.jpeg", "Mockup white t-shirt back building print", "tshirt-weiss"),
  ("WhatsApp Image 2023-11-24 at 16.00.40 (1).jpeg", "ref-mockup-hoodie-schwarz-front-logo.jpeg", "Mockup black hoodie front CSH logo", "hoodie-schwarz"),
]
for row in BL:
    shop = row[4] if len(row) > 4 else False
    ENTRIES.append(e("Blanked", row[0], row[1], row[2], row[3] if len(row) > 3 else None, shop=shop))
# fmt: on

def main():
    # verify count
    assert len(ENTRIES) == 204, f"Expected 204 entries, got {len(ENTRIES)}"

    # ensure unique proposed names per folder
    seen = set()
    for ent in ENTRIES:
        key = (ent["folder"], ent["proposed_name"])
        if key in seen:
            base, ext = ent["proposed_name"].rsplit(".", 1)
            n = 2
            while (ent["folder"], f"{base}-{n}.{ext}") in seen:
                n += 1
            ent["proposed_name"] = f"{base}-{n}.{ext}"
            key = (ent["folder"], ent["proposed_name"])
        seen.add(key)

    index = {
        "version": 2,
        "generated": "visual-analysis",
        "total_files": len(ENTRIES),
        "naming_convention": "{product}-{farbe}-{ansicht}-{kontext}[-variant].ext | lifestyle-* | ref-* | brand-* | combo-*",
        "folders": {
            "Shooting 1": "Early studio — black hoodie & black tee only (38)",
            "Shooting 2": "Main shoot — all 3 hoodie colors + 2 tee colors, studio/snow/campus (123)",
            "Shooting 3": "Outdoor lifestyle — campus, cross-generation (32)",
            "Blanked": "Reference, mockups, brand assets (11)",
        },
        "shop_products": {
            "hoodie-blau": "Navy hoodie — CSH crest logo front",
            "hoodie-schwarz": "Black hoodie — logo front, building print back",
            "hoodie-weiss": "White hoodie — black logo front, building print back",
            "tshirt-schwarz": "Black t-shirt — CSH circle logo front",
            "tshirt-weiss": "White t-shirt — CSH logo front, building print back",
        },
        "files": ENTRIES,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(ENTRIES)} files)")

    # copy to _named/
    folder_map = {
        "Shooting 1": "shooting-1",
        "Shooting 2": "shooting-2",
        "Shooting 3": "shooting-3",
        "Blanked": "blanked",
    }
    copied = 0
    for ent in ENTRIES:
        src = BASE / ent["folder"] / ent["original"]
        dst_dir = NAMED / folder_map[ent["folder"]]
        dst_dir.mkdir(parents=True, exist_ok=True)
        dst = dst_dir / ent["proposed_name"]
        if src.exists():
            shutil.copy2(src, dst)
            copied += 1
        else:
            print(f"MISSING: {src}")
    print(f"Copied {copied} files → {NAMED}")


if __name__ == "__main__":
    main()
