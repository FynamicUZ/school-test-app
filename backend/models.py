from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(String, unique=True, index=True)
    role = Column(String, default="student") # "teacher" or "student"
    name = Column(String, nullable=True)

    tests_created = relationship("Test", back_populates="teacher", foreign_keys='Test.teacher_id')
    submissions = relationship("Submission", back_populates="student")

class Test(Base):
    __tablename__ = "tests"
    
    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    num_questions = Column(Integer)
    answer_key = Column(String) # E.g. "A,B,C,D"
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    file_id = Column(String, nullable=True) # Telegram file_id for the test distribution
    
    teacher = relationship("User", back_populates="tests_created", foreign_keys=[teacher_id])
    submissions = relationship("Submission", back_populates="test")

class Submission(Base):
    __tablename__ = "submissions"
    
    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(Integer, ForeignKey("tests.id"))
    student_id = Column(Integer, ForeignKey("users.id"))
    answers = Column(String) # Raw answers e.g. "A,B,C,A"
    submitted_at = Column(DateTime)
    person_ability = Column(String, nullable=True) # Rasch model ability score (beta)
    
    test = relationship("Test", back_populates="submissions")
    student = relationship("User", back_populates="submissions")
