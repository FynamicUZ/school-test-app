import numpy as np
from typing import List, Tuple

def calculate_rasch(answers_matrix: List[List[int]]) -> Tuple[List[float], List[float]]:
    """
    Rasch Model Scoring calculation.
    
    answers_matrix: 2D array [number_of_students][number_of_questions]
    1 for correct, 0 for incorrect.
    
    Returns:
        person_ability (beta): List of abilities for each student
        item_difficulty (delta): List of difficulties for each question
    """
    scores = np.array(answers_matrix)
    
    if scores.size == 0:
        return [], []
        
    num_students, num_questions = scores.shape
    
    beta = np.zeros(num_students)
    delta = np.zeros(num_questions)
    
    # Simple JMLE Approximation
    for _ in range(15):
        for i in range(num_students):
            p = 1 / (1 + np.exp(-(beta[i] - delta)))
            diff = np.sum(scores[i] - p)
            var = np.sum(p * (1 - p))
            if var > 0:
                beta[i] += diff / var
                
        for j in range(num_questions):
            p = 1 / (1 + np.exp(-(beta - delta[j])))
            diff = np.sum(p - scores[:, j])
            var = np.sum(p * (1 - p))
            if var > 0:
                delta[j] += diff / var
                
    # Center Item difficulties around 0 (Normalization step)
    delta = delta - np.mean(delta)
    
    return beta.tolist(), delta.tolist()
