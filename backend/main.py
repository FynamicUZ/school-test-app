from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

from . import models, database, rasch

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="School Test API")

# Allow CORS for local testing
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (Previous Schemas)

@app.get("/tests/{test_id}/rasch")
def get_rasch_analysis(test_id: int, db: Session = Depends(database.get_db)):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    subs = db.query(models.Submission).filter(models.Submission.test_id == test_id).all()
    if not subs:
        return {"abilities": [], "difficulties": []}
        
    # Prepare answer matrix (1 for correct, 0 for wrong)
    key = test.answer_key.split(',')
    matrix = []
    for s in subs:
        student_answers = s.answers.split(',')
        # Compare student answers with key
        row = [1 if student_answers[i] == key[i] else 0 for i in range(len(key))]
        matrix.append(row)
        
    abilities, difficulties = rasch.calculate_rasch(matrix)
    return {"abilities": abilities, "difficulties": difficulties}

# --------- Routes ---------

class UserCreate(BaseModel):
    telegram_id: str
    role: str
    name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    telegram_id: str
    role: str
    name: Optional[str] = None

    class Config:
        from_attributes = True

class TestCreate(BaseModel):
    teacher_id: int
    num_questions: int
    answer_key: str
    start_time: datetime
    end_time: datetime

class TestResponse(BaseModel):
    id: int
    teacher_id: int
    num_questions: int
    start_time: datetime
    end_time: datetime
    file_id: Optional[str] = None

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    test_id: int
    student_id: int
    answers: str

# --------- Routes ---------

@app.post("/users/", response_model=UserResponse)
def create_or_get_user(user: UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.telegram_id == user.telegram_id).first()
    if db_user:
        return db_user
    db_user = models.User(
        telegram_id=user.telegram_id,
        role=user.role,
        name=user.name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/users/{telegram_id}", response_model=UserResponse)
def get_user(telegram_id: str, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.telegram_id == telegram_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@app.post("/tests/", response_model=TestResponse)
def create_test(test: TestCreate, db: Session = Depends(database.get_db)):
    db_test = models.Test(
        teacher_id=test.teacher_id,
        num_questions=test.num_questions,
        answer_key=test.answer_key,
        start_time=test.start_time,
        end_time=test.end_time
    )
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    return db_test

@app.get("/tests/active", response_model=List[TestResponse])
def get_active_tests(db: Session = Depends(database.get_db)):
    current_time = datetime.utcnow()
    active_tests = db.query(models.Test).filter(
        models.Test.start_time <= current_time,
        models.Test.end_time >= current_time
    ).all()
    return active_tests

@app.get("/tests/{test_id}", response_model=TestResponse)
def get_test_by_id(test_id: int, db: Session = Depends(database.get_db)):
    test = db.query(models.Test).filter(models.Test.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test

@app.post("/submissions/")
def submit_answers(sub: SubmissionCreate, db: Session = Depends(database.get_db)):
    test = db.query(models.Test).filter(models.Test.id == sub.test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
        
    current_time = datetime.utcnow()
    if current_time > test.end_time:
        raise HTTPException(status_code=400, detail="Test has ended")
        
    db_sub = models.Submission(
        test_id=sub.test_id,
        student_id=sub.student_id,
        answers=sub.answers,
        submitted_at=current_time
    )
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return {"message": "Submission successful", "submission_id": db_sub.id}
