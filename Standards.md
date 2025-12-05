JavaScript (Node.js) Standards

1. File Structure

A clear folder structure helps a lot in larger projects:

project/
├─ src/                 # source code
│ ├─ controllers/       # route logic
│ ├─ routes/            # API endpoints
│ ├─ models/            # database models
│ ├─ services/          # business logic helpers
│ ├─ middleware/        # express middleware
│ └─ index.js           # entry point
├─ tests/               # unit/integration tests
├─ package.json
├─ .env                 # environment variables
└─ README.md

2. File Naming Conventions

camelCase for utils and functions: dateFormatter.js

PascalCase for components/classes: MyButton.js

kebab-case for folders: user-profile/

3. Variables and Functions

camelCase for variables and functions:
const userName = 'Alice';
function calculateTotal(price, tax) {}

PascalCase for classes:
class UserProfile {}

UPPER_SNAKE_CASE for constants:
const MAX_USERS = 100;

4. Strings

Use single quotes or backticks consistently:

const name = 'Alice';
const message = `Hello, ${name}!`;

5. Best Practices

Use const and let, not var.

Always use strict mode: use strict.

6. Documentation

README.md: project explanation, installation, usage
