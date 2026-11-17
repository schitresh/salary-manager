## Objective

Build an employee salary management software for an organization with 10K employees.

- The software will be used by the HR team to manage salary data of employees. It should manage around 10K employees located across multiple countries.
- The HR team should be able to answer questions about how the organization pays its employees. It should have a functionality to calculate analytics based on different criteria.
- The employees are located across multiple countries, so it should be able to track salaries in different currencies.

## Features In Scope

The HR team currently manages everything via excel, so this release should focus on building the primary features that can capture the essential details easily. It should drive the easy adoption of the software from excel sheets. Though, the software should be kept flexible and scalable to capture more details later.

- The software should have a profile for each employee with basic information like name, contact, employment details, etc.
- It should have the list of departments where employees are employed. It should track the department name, associated office and its location, department head, etc.
- It should track the salary information of the employees along with the history. Since the salaries may change during increments, all salary entries must be tracked to maintain a proper record.
- The details and breakdown of the salary should be stored like base salary, HRA, deductions, etc. The salary details should also track the currency according to the employee's office location.
- The HR team should be able to view and manage all the salary details. They should be able to add or edit details of any employee, department, salary. The software should allow searching employees based on department, position, office location, etc.
- There should be a way for the HR team to view primary analytics like total, average, median, etc. for HR team. These values should be shown based on different constraints like department, position, office location, etc.

## Features Out of Scope

The initial release will be a simple software with the most prominent functionalities. To ensure a faster release and smooth adoption of the software, some of the advanced and complex features will be out of scope during the first phase of the development.

- Allowing employees to view their information and salary details can be done later. For this release, the users will by default be HR team members. This functionality can be extended later by adding a new type of users for employees using roles.
- Allowing employees to request changes in their profile or seek information or resolve doubts regarding their system can be taken up later. A ticketing system can be created later for this purpose.
- Aggregating and comparing salaries across countries will require converting currencies to a common currency. This functionality can be added later, currently salaries with the same currency should be aggregated.
- The current analytics will support only basic measurements like averages. Some primary filters like department, position, office location are sufficient at this point. Complex filtering constraints and combinations can be added later as per requirements.
- Details of regular payments made for each employee in accordance with the salary is out of scope at this point. This also includes generating and storing pay slips of periodic payments.
- Tax calculations and deductions will be too complex to handle at this point. This also includes generating and storing annual tax documents that are provided at the end of each year.

## Tech Stack

- The software will have a backend and a frontend. The backend and the frontend servers will run independently. The frontend server will interact with the backend server through REST APIs.
- The backend will be built on Ruby on Rails. It should have meaningful set of unit tests that cover the core functionality. The test should be fast, deterministic, and easy to understand.
- The frontend will be built on React.js. For UI entities and components, the MUI library will be used. Tests are not required for frontend currently.
- Since the salary data is structured with specific constraints and validations, it should be stored in relational schema with MySQL as the database.
- The application will provide a working, demoable end-to-end flow so that users can interact with the features. It should have a script to seed data for 10K employees.

## Technical Specifications

### Performance Considerations

- Since we are storing salaries of around 10K employees, the backend api should paginate the responses. And the frontend should allow users to navigate the list.
- The salary data should be indexed on important criteria like employee, department, etc. so that it's easier to filter the data and calculate analytics.
- De-normalize data where it makes it easier to refer or filter most used details. For example, it will be beneficial to store the currency directly into salary details rather than figuring it out through the office location.
- Create a dedicated api endpoint for analytics to help aggregate data easily by utilizing the SQL database directly.

### Authentication

- Handle authentication using 'devise' gem. Setup a 'user' model which will be a HR team member. Login will be supported only through email and password. Third party logins like google is out of scope for this release.
- The user should be allowed to register and login only through the official email of the organization. The email should end with '@official.com'.
- Keep track of the default timestamps available with devise gem like current login, last login, etc. Also, provide an option to reset password.
- Since we are considering the user as a HR team member by default, authorization is not required at this point. Authorization and permissions based on user types or roles will be added later.
- Use the devise backed jwt token for authentication, but integrate it using the api endpoints specified below. It should respond to json format for better compatibility with the frontend server.
- Two factor authentication is also not required at this point, it will be added later.

### Models

Note: Since foreign keys are by default indexed, they are not mentioned exclusively in indexed columns. All models should have timestamps (created_at, updated_at), they are also not mentioned exclusively.

- User
  - Columns
    - id: bigint, email: string
    - Devise gem will handle the additional fields like password, current login, last login, etc.
    - Indexed columns: email
  - Validations
    - Email is a required field and should be unique.
    - Only the emails ending with '@official.com' should be allowed.
    - The official HR email 'hr@official.com' can be used to initially create the accounts of the HR team members.
- Employee
  - Columns
    - id: bigint, employee_code: string, first_name: string, last_name: string, email: string, phone: string, date_of_birth: date, date_of_joining: date, last_working_day: date, job_title: string
    - Foreign keys: department_id
    - Indexed columns: date_of_joining, job_title
  - Validations
    - First name, last name, date of birth, date of joining, job title, department id are required fields.
    - Employee code, email, phone are required and should be unique.
    - Date of birth should ensure that the employee is at least 18 years old.
    - Last working day should be after the date of joining. It will be nullable for employees that are currently working.
    - Keep the current position as free text currently. When we have the list of all the valid positions, we can validate against it.
- Location
  - Columns
    - id: bigint, city: string, state_code: string, country_code: string
    - Indexed columns: state_code, country_code
  - Validations
    - City, state code, country code are required fields.
    - City, state code, country code should be a unique combination.
    - Validate state code and country code using the 'carmen' gem.
    - Keep city name as open text for now.
- Department
  - Columns
    - id: bigint, name: string
    - Foreign keys: location_id, head_employee_id
    - Indexed columns: name
  - Validations
    - The required fields are name, location id
    - Name & location id is a unique combination
- Salary
  - Columns
    - id: bigint, applicable_from: date, applicable_till: date, job_title: string, currency: string, base_amount: decimal (12, 2), hra_amount: decimal(12, 2), bonus_amount: decimal(12, 2), deduction_amount: decimal (12, 2), total_amount: decimal (12, 2), frequency: string
    - Foreign keys: employee_id, department_id
    - Indexed columns: applicable_from, applicable_till, job_title, currency
  - Validations
    - The required fields are applicable from, job title, currency, employee id, department id
    - Validate the currency code using the 'money' gem.
    - The total amount will be sum of base amount, hra amount, bonus amount subtracted by deduction amount
    - Currently, only monthly salaries are supported. So, frequency will be month by default.
    - The base amount should be greater than zero, while other amounts can be zero.
    - The values in amount columns should positive or zero. The deduction amount should also be positive or zero since the column name itself signifies its intent.
    - The 'applicable_till' date should be after the 'applicable_from' date. The 'applicable_from' date should be after or on the 'date_of_joining' mentioned in the Employee model.
    - The most recent salary should have optional 'applicable_till' for open-ended contracts. If a new salary is added, the 'applicable_till' should be filled first in the previous one.
    - There should not be any other entry overlapping within this salary's applicable period with any other salary of the employee.

### APIs

We should version the api to allow for any significant changes later. A simple versioning system starting with v1 should be sufficient for this software.

The filtering will be done through url params, so explicit paths are not necessary. The `filter` keyword should be used for these params. For example, to filter salaries by department, `GET /salaries?filter[department_id]=1` can be used.

For pagination, `page[size]` and `page[number]` params should be used.

These are the api endpoints. All these endpoints will be prefixed '/v1', so not specified explicitly.

- For User, create and read are sufficient for now.
  - GET /users
  - POST /users
- For Employee, create, read, update are sufficient. Deleting an employee can be added later if required. An employee with any existing salary record should not be allowed to be deleted, the data will be required for record keeping.
  - GET /employees
  - GET /employees/:id
  - POST /employees
  - PATCH /employees/:id
- For Location, create, read, update are sufficient. Deleting can be added later like Employee.
  - GET /locations
  - GET /locations/:id
  - POST /locations
  - PATCH /locations/:id
- For Department, create, read, update are sufficient. Deleting can be added later like Employee.
  - GET /departments
  - GET /departments/:id
  - POST /departments
  - PATCH /departments/:id
- For Salary, create, read, update are sufficient. Deleting can be added later like Employee. Additionally, an analytics endpoint is required.
  - GET /salaries
  - GET /salaries/:id
  - GET /salaries/analytics
  - POST /salaries
  - PATCH /salaries/:id

### Analytics

- The analytics endpoint in salaries should return total, average, median salary of total amount of all the filtered records.
- It should consider only the current applicable salaries, that is, today's date is on or after applicable_from and applicable_till is either null or on or after today's date.
- It should allow these filters: department id, location id, city, state code, job title. They can be resolved via related models like department, location.
- It should raise an error if there is mismatch in currency of any filtered records, asking user to filter accordingly.

## Frontend & UI

- The users can register only through invite. The official HR email 'hr@official.com' will be seeded which can be used to create user accounts for HR team members. These users will be notified to register themselves.
- The root page will always be the login page with an option to reset password. Only after the user has logged in, other pages will be rendered.
- Each model from backend will have its component for easy navigation. Use a sidebar menu to allow user to select the appropriate model to work on.
- Use pre-existing components from MUI library for UI components. At this point, use only the standard components, customizations are not required currently.
- Keep components modular which are easy to render and maintain. For example, listing page, viewing page, forms, etc. should be designed as a separate component. If need be, use partial components as well.
