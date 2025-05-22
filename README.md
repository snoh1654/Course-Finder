# Course Finder

## Overview

**Course Finder** is a full-stack web application developed as an academic project. The application enables users to query and analyze course and through a custom domain-specific language.

## Features

- **Dataset Management**: Add, remove, and list course and room datasets.
- **Custom Query Engine**: Parse and execute queries defined in a DSL based on EBNF grammar.
- **Asynchronous Processing**: Handle asynchronous operations using Promises and async/await patterns.
- **HTML Parsing**: Extract room information from HTML files using the `parse5` library.
- **Geolocation Integration**: Retrieve latitude and longitude data for buildings via HTTP requests.
- **RESTful API**: Expose backend functionalities through RESTful endpoints.
- **Frontend Interface**: Provide a user-friendly interface for interacting with the application.

## Technologies Used

- **Languages**: TypeScript
- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript
- **Testing**: Mocha, Chai

## Usage

- **Adding a Dataset**:
  Send a `PUT` request to `/dataset/{id}/{kind}` with the dataset file in the request body.

- **Removing a Dataset**:
  Send a `DELETE` request to `/dataset/{id}`.

- **Listing Datasets**:
  Send a `GET` request to `/datasets`.

- **Performing a Query**:
  Send a `POST` request to `/query` with the query JSON in the request body.

## Testing

The project includes comprehensive unit and integration tests to ensure functionality and reliability. Tests cover various scenarios, including:

- Valid and invalid dataset additions
- Query parsing and execution
- Error handling and edge cases
- Frontend and backend integration

To run the tests, execute:

```bash
yarn test
```

## Setup and Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/ubc-course-finder.git
   cd ubc-course-finder
   ```

2. **Install Dependencies**:
   ```bash
   yarn install
   ```

3. **Build the Project**:
   ```bash
   yarn build
   ```

4. **Run Tests**:
   ```bash
   yarn test
   ```

5. **Start the Server**:
   ```bash
   yarn start
   ```

6. **Access the Frontend**:
   Open your browser and navigate to `http://localhost:4321` to interact with the application.

