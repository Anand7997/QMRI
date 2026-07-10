import json, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

BASE = "http://localhost:5254/api/v1"
SCORING_MODEL = "30000000-0000-0000-0000-000000000001"


def req(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


def login():
    _, d = req("POST", "/auth/login", body={"userNameOrEmail": "testuser@quinnox.com", "password": "Test@1234"})
    return d["accessToken"]


def all_questions(tok):
    out, page = [], 1
    while True:
        _, d = req("GET", f"/assessment-catalog/questions?page={page}&pageSize=200", tok)
        out.extend(d["items"])
        if len(out) >= d["totalCount"] or not d["items"]:
            break
        page += 1
    return out


def wipe(tok):
    _, lst = req("GET", "/assessments", tok)
    for a in lst or []:
        req("DELETE", f"/assessments/{a['assessmentId']}", tok)
    print("wiped", len(lst or []))


def build(tok, qs, title, desc, answer_fn, limit=None, submit=True):
    st, a = req("POST", "/assessments", tok, {"scoringModelId": SCORING_MODEL, "title": title, "description": desc})
    if st >= 400:
        print("create fail", st, a)
        return
    aid = a["assessmentId"]
    subset = qs[:limit] if limit else qs

    def answer(pair):
        i, q = pair
        return req("PUT", f"/assessments/{aid}/responses", tok,
                   {"questionId": q["questionId"], "answer": answer_fn(i), "findings": None})[0]

    with ThreadPoolExecutor(max_workers=16) as ex:
        codes = list(ex.map(answer, enumerate(subset)))
    fails = sum(1 for c in codes if c >= 400)
    if submit:
        st, s = req("POST", f"/assessments/{aid}/submit", tok, None)
    else:
        st, s = "-", None
    print(f"{title}: answered {len(subset)} fails={fails} submit={st}")


def main():
    tok = login()
    qs = all_questions(tok)
    print("questions", len(qs))
    wipe(tok)
    # Scored, high (mostly Yes, some Partial) -> should pass
    build(tok, qs, "Q1 QA Maturity Assessment", "First quarter baseline.", lambda i: 2 if i % 5 else 1)
    # Scored, mixed (Yes/Partial/No) -> lower score
    build(tok, qs, "Q2 QA Maturity Assessment", "Second quarter review.", lambda i: [2, 1, 0][i % 3])
    # In-progress, ~35% answered, not submitted
    build(tok, qs, "Q3 QA Maturity Assessment", "In-flight assessment.", lambda i: 1, limit=int(len(qs) * 0.35), submit=False)
    _, lst = req("GET", "/assessments", tok)
    for a in lst:
        print(" ->", a["title"], "status", a["status"], "score", a.get("overallScore"), "compl", round(a["completionPercentage"]))


if __name__ == "__main__":
    main()
