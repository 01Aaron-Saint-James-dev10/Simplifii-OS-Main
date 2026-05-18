UNIVERSITY_CONTEXT = {
    "UNSW Sydney": {
        "termType": "trimester",
        "termNames": ["Term 1", "Term 2", "Term 3"],
        "gradeScale": "HD/DN/CR/PS/FL",
        "docTerms": {
            "brief": "Assignment Brief",
            "course": "Course",
            "outline": "Course Outline",
            "rubric": "Marking Criteria",
        },
    },
    "University of Sydney (USYD)": {
        "termType": "semester",
        "termNames": ["Semester 1", "Semester 2"],
        "gradeScale": "HD/D/C/P/F",
        "docTerms": {
            "brief": "Task Sheet or Assessment Brief",
            "course": "Unit of Study",
            "outline": "Unit Outline",
            "rubric": "Marking Criteria",
        },
    },
    "University of Technology Sydney (UTS)": {
        "termType": "semester",
        "termNames": ["Autumn Session", "Spring Session"],
        "gradeScale": "HD/D/C/P/F",
        "docTerms": {
            "brief": "Assignment Brief",
            "course": "Subject",
            "outline": "Subject Outline",
            "rubric": "Assessment Criteria",
        },
    },
    "Monash University": {
        "termType": "semester",
        "termNames": ["Semester 1", "Semester 2"],
        "gradeScale": "HD/D/C/P/N",
        "docTerms": {
            "brief": "Assignment Brief",
            "course": "Unit",
            "outline": "Unit Guide",
            "rubric": "Assessment Rubric",
        },
    },
    "University of Melbourne": {
        "termType": "semester",
        "termNames": ["Semester 1", "Semester 2"],
        "gradeScale": "H1/H2A/H2B/H3/P/N",
        "docTerms": {
            "brief": "Assignment Brief",
            "course": "Subject",
            "outline": "Subject Guide",
            "rubric": "Assessment Criteria",
        },
    },
    "Australian National University (ANU)": {
        "termType": "semester",
        "termNames": ["Semester 1", "Semester 2"],
        "gradeScale": "HD/D/CR/P/N",
        "docTerms": {
            "brief": "Assignment Brief",
            "course": "Course",
            "outline": "Course Outline",
            "rubric": "Marking Rubric",
        },
    },
    "University of Queensland (UQ)": {
        "termType": "semester",
        "termNames": ["Semester 1", "Semester 2"],
        "gradeScale": "HD/D/C/P/F",
        "docTerms": {
            "brief": "Assessment Brief",
            "course": "Course",
            "outline": "Course Profile",
            "rubric": "Marking Criteria",
        },
    },
    "Queensland University of Technology (QUT)": {
        "termType": "semester",
        "termNames": ["Semester 1", "Semester 2"],
        "gradeScale": "HD/D/C/P/F",
        "docTerms": {
            "brief": "Assessment Brief",
            "course": "Unit",
            "outline": "Unit Outline",
            "rubric": "Marking Rubric",
        },
    },
    "default": {
        "termType": "semester",
        "termNames": ["Semester 1", "Semester 2"],
        "gradeScale": "HD/D/C/P/F",
        "docTerms": {
            "brief": "Assessment Brief",
            "course": "Course",
            "outline": "Course Outline",
            "rubric": "Marking Rubric",
        },
    },
}


def get_university_context(university: str) -> dict:
    return UNIVERSITY_CONTEXT.get(university, UNIVERSITY_CONTEXT["default"])


def build_context_string(user_profile: dict) -> str:
    uni = user_profile.get("university", "")
    year = user_profile.get("studyYear", "")
    faculty = user_profile.get("faculty", "")
    if not uni:
        return ""
    ctx = get_university_context(uni)
    terms_str = ", ".join(ctx["termNames"])
    brief_term = ctx["docTerms"]["brief"]
    course_term = ctx["docTerms"]["course"]
    return (
        f"STUDENT CONTEXT:\n"
        f"University: {uni}\n"
        f"Year: {year}\n"
        f"Faculty: {faculty}\n"
        f"Term structure: {ctx['termType']} ({terms_str})\n"
        f"Grade scale: {ctx['gradeScale']}\n"
        f"Use this university's exact terminology in all outputs. "
        f"Use '{brief_term}' not 'assignment'. "
        f"Use '{course_term}' not 'unit' unless that is correct for this university.\n\n"
    )
