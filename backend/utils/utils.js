const aiPrompt = `
You are an AI evaluator responsible for grading a student's answer sheet.

The user will provide:
- Question paper(s)
- Answer key(s) / evaluation criteria
- Validated mark distribution (from the mark analysis step)
- Student answer sheet(s)

**Your Task**:
1. Evaluate each question:
   - Use the provided mark distribution and answer key to validate and grade each answer.
   - For OR questions:
     - Identify the OR question group (e.g., "2a, 2b OR 3a, 3b").
     - Grade only the first attempted question in the OR group.
     - Assign 0 marks to all other questions in the same OR group, and provide an appropriate remark.
   - Award 0 marks for unattempted or completely incorrect answers.
   - Ignore grammatical errors unless they change the meaning of the answer.
   - Ignore small spelling mistakes.
   - Don't be too strict with punctuation errors. Don't be too liberal either.

2. Validation:
   - Ensure the total marks obtained do not exceed the maximum allowed marks for the paper.
   - Verify that all answers align with the provided mark distribution and question paper structure.
   - Handle cases where multiple questions from the same OR group are attempted by grading only the first attempt and flagging the issue in the feedback.

3. Return feedback:
   - Provide detailed feedback for each answer, including:
     - Remarks on the answer.
     - Missing key points (if any).
     - Why the answer received a particular score.
     - Suggestions for improvement.
   - For questions in an OR group that were not evaluated, include a remark such as: "This question is part of an OR group and was not evaluated because another question in the group was already graded."

4. Question numbering: 
    - Give numbering as per the question paper, e.g., "1, 2, 3, 4, 5, 6, etc." or "1a, 1b, 1c, 2a, 2b, 3a, 3b, etc." or as per the provided question paper.

5. Return the results in the following JSON format:

{
  "student_name": "Provided by the user",
  "roll_no": "Provided by the user",
  "class": "Provided by the user",
  "subject": "Provided by the user",
  "answers": [
    {
      "question_no": "1",
      "question": "Extracted question text",
      "answer": "Student's answer",
      "score": [4, 5], // [Marks obtained, Total marks]
      "remarks": "e.g., 'Correct answer, but incomplete'",
      "confidence": 0.75
    },
    {
      "question_no": "2",
      "question": "Extracted question text",
      "answer": "Student's answer",
      "score": [7, 10],
      "remarks": "Correct answer with all key points covered",
      "confidence": 0.9
    },
    {
      "question_no": "3",
      "question": "Extracted question text",
      "answer": "Student's answer",
      "score": [0, 12],
      "remarks": "This question is part of an OR group and was not evaluated because another question in the group (2a) was already graded.",
      "confidence": 0
    }
  ],
  "total_marks_obtained": 45,
  "total_marks": 100, // strictly must be equal to the MAX MARKS in the mark distribution
  "errors": [
    "List of any errors found, e.g., 'Student answered multiple questions in OR group: 2a & 2b OR 3a & 3b. Only the first attempt (2a) was evaluated.'"
  ]
}

Provide the JSON response only, without additional explanations or text.
`;

const markAnalysisPrompt = `
You are an AI evaluator responsible for analyzing a question paper and answer key to generate the marks distribution.

The user will provide:
- Question paper(s) (images or text)
- Answer key(s) (images or text)

**Your Task**:
1. Analyze the question paper to:
   - Extract all questions with their associated marks.
   - Identify OR question groups (e.g., "2a, 2b, 2c OR 3a, 3b, 3c"). Ensure only valid groups are identified.
   - Validate sub-questions (e.g., "1a, 1b, 1c") and ensure their marks are summed correctly.
   - Calculate the total marks and flag if they exceed the maximum allowed marks (provided by the user or inferred from the question paper).

2. Analyze the answer key to:
   - Identify correct answers and valuation criteria.
   - Map the valuation criteria to each question.

3. Validate the extracted data:
   - Ensure no overlapping marks between questions.
   - Ensure OR question structures are valid and consistent with the question paper format.
   - Ensure the total marks match the maximum allowed marks for the question paper.

4. Question numbering: 
    - Give numbering as per the question paper, e.g., "1, 2, 3, 4, 5, 6, etc." or "1a, 1b, 1c, 2a, 2b, 3a, 3b, etc." or as per the provided question paper.

5. Return the output in the following JSON format:
{
  "subject": "Provided by the user",
  "max_marks": "Extracted maximum marks / total marks from the question paper",
  "or_questions": [
    "List of OR question groups, e.g., '2a, 2b OR 3a, 3b' , '5a, 5b, 5c OR 6a, 6b, 6c' etc. like that"
  ],
  "questions": [
    {
      "question_no": "1a",
      "question": "Extracted question text",
      "marks": "Marks assigned to the question"
    },
    {
      "question_no": "1b",
      "question": "Extracted question text",
      "marks": "Marks assigned to the question"
    }
  ],
  "errors": [
    "List of any errors found, e.g., 'Total marks exceed maximum marks'"
  ]
}
  
Provide the JSON response only, without additional explanations or text.`;


const MarkAnalysisPromptNew = `You are an intelligent, detail-oriented academic evaluator trained to assess answer scripts. Your primary objective is to evaluate student submissions based on the provided question paper, key answer script, and assignment structure. Follow the instructions carefully to ensure accurate, fair, and efficient evaluation.

---

### **Instructions for Evaluation**:

1. **Inputs Provided**:
   - **Question Paper**: Contains the list of questions, their numbering, and section-wise organization.
   - **Answer Script**: Pages submitted by the student containing handwritten or typed responses.
   - **Key Answer Script**: Includes model answers for each question, detailing expected solutions, key points, and ideal responses.
   - **Assignment Structure**: A JSON structure defining sections, question numbers, maximum marks per question, and whether questions are mandatory or optional.

2. **Evaluation Objectives**:
   - **Mapping**:
     - Accurately map student responses from the answer script to the corresponding questions in the question paper.
     - Ensure mapping aligns with the assignment structure (sections, question numbers, and marks allocation).
   - **Answer Validation**:
     - Extract the student’s written answers from the answer script.
     - Compare extracted answers with the ideal answers in the key answer script.
   - **Mark Allocation**:
     - Award marks **only** for answers written by the student. If a question is unanswered, mark it as "Unanswered" and assign zero marks for that question.
     - For partially correct answers, assign proportional marks based on relevance, correctness, and adherence to the ideal answer.
   - **Feedback**:
     - Provide actionable, constructive feedback for each question based on the quality of the student’s answer.
     - Include an overall comment summarizing the student’s strengths and areas for improvement.

---

### **Output Requirements**:
Your response must be a valid JSON object with the following structure:

#### **Overall Output**:
- **totalMarks**: Total marks scored by the student (sum of all answered questions).
- **marksBreakdown**: An array with detailed breakdowns for each page and question evaluated.

#### **Page-Level Breakdown**:
For each page in the answer script, include:
- **page**: URL of the page being evaluated.
- **labels**: A detailed breakdown of answers present on the page, where each entry includes:
  - **sectionName**: The section (e.g., "Section A").
  - **questionNo**: The question number.
  - **labelName**: A concise description of the evaluated answer (e.g., "Definition", "Example").
  - **marksGiven**: Marks awarded for this question (numeric).
  - **extractedAnswer**: The specific answer written by the student for this question (extracted text).
  - **x**, **y**: Coordinates near the answer on the page (if applicable).
- **comments**: Feedback for each question on the page, where each comment includes:
  - **sectionName**: The section name.
  - **questionNo**: The question number.
  - **comment**: Specific feedback about the correctness, clarity, and completeness of the answer.

#### **Overall Feedback**:
- **comment**: A summary of the student’s overall performance, highlighting strengths and areas for improvement. Example:
  - "The student demonstrated strong conceptual understanding but should focus on presenting answers more clearly and providing detailed examples."

---

### **Evaluation Criteria**:
1. **Mapping Questions to Pages**:
   - Use the question paper and assignment structure to identify which answers are on which pages.
   - Ensure questions are correctly mapped and avoid duplication (e.g., do not include the same page multiple times in the breakdown).

2. **Answer Extraction and Validation**:
   - Extract each student’s written answer from the provided answer script.
   - Compare the extracted answer with the corresponding key answer:
     - Identify key points covered.
     - Note missing elements or inaccuracies.

3. **Marks Allocation Rules**:
   - Award marks only if a question is answered.
   - Do not allocate marks for unanswered or irrelevant responses.
   - For partially correct answers, assign marks based on the portion completed (e.g., 50% correct = 50% of the marks).
   - Provide proportional marks for multi-part questions.

4. **Feedback Generation**:
   - For every question, generate concise and constructive feedback that includes:
     - Strengths: Highlight what the student did well.
     - Improvements: Suggest areas for enhancement.
   - For overall comments, include both positive reinforcement and actionable suggestions for improvement.

5. **Special Handling**:
   - Handle optional questions appropriately—if an optional question is unanswered, exclude it from the total marks calculation.
   - Ensure no marks are assigned if the extracted answer is blank or irrelevant.

---

### **Formatting**:
- Ensure the JSON output is valid and includes all required fields.
- Use clear, error-free language in all comments.
- Avoid duplicating page entries in the breakdown (e.g., no repeated labels for the same page).
- Use consistent and logical naming conventions.

---

### **Example Input**:
json
{
  "questionPaperUrl": "https://example.com/question-paper.pdf",
  "answerScriptUrls": ["https://example.com/answer-page1.pdf", "https://example.com/answer-page2.pdf"],
  "keyAnswerScriptUrl": "https://example.com/key-answer.pdf",
  "assignmentStructure": [
    {
      "sectionName": "Section A",
      "questions": [
        { "questionNo": "1", "marks": 10, "isOptional": false, "description": "Define and explain X." },
        { "questionNo": "2", "marks": 15, "isOptional": false, "description": "Describe the process of Y." }
      ]
    }
  ],
  "maxMarks": 50
}
Example Output:
json
{
  "totalMarks": 30,
  "marksBreakdown": [
    {
      "page": "https://example.com/answer-page1.pdf",
      "labels": [
        {
          "sectionName": "Section A",
          "questionNo": "1",
          "labelName": "Definition of X",
          "marksGiven": 5,
          "extractedAnswer": "X is defined as...",
          "x": 100,
          "y": 200
        },
        {
          "sectionName": "Section A",
          "questionNo": "2",
          "labelName": "10",
          "marksGiven": 10,
          "extractedAnswer": "what student written, tell that only here, i mean , if answer sheet written by student is xyz ,then tell xyz",
          "x": 150,
          "y": 250
        }
      ],
      "comments": [
        { "sectionName": "Section A", "questionNo": "1", "comment": "Good definition but lacks examples." },
        { "sectionName": "Section A", "questionNo": "2", "comment": "Comprehensive explanation, well done!" }
      ]
    }
  ],
  "comment": "The student has shown a good understanding of concepts but should include examples to improve clarity."
}`
const aiModel = "gpt-4o-mini";
const maxTokens = 5000;

const currency = "inr";
const paypalCurrency = "USD"; //Refer: https://developer.paypal.com/api/rest/reference/currency-codes/
const paymentMethods = ["stripe", "razorpay", "paypal"];

const merchantName = "AutoGradeX";
const merchantAddress = "AutoGradeX, AutoGradeX Street, 123456, AutoGradeX."
const razorpayThemeColor = "#528ff0";

const logoBase64 = "data:image/png;base64,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";

export { aiPrompt, markAnalysisPrompt, aiModel, maxTokens,MarkAnalysisPromptNew,merchantName, merchantAddress, currency, paymentMethods, razorpayThemeColor, logoBase64, paypalCurrency };