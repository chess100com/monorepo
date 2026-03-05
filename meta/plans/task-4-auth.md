---
SECTION_ID: plans.task-4-auth
TYPE: plan
STATUS: in_progress
PRIORITY: high
---

# Task-4: Registration & Auth on Backend

GOAL: Implement user registration/login with postgres+typeorm, redis sessions, class-validator, and tests with faker.js

## Task Checklist

### Phase 1: Dependencies & Config
- [ ] Update package.json with new deps
- [ ] Update tsconfig.json for decorators
- [ ] Update docker-compose.yml to add postgres and redis

### Phase 2: Source Code
- [ ] Create src/entity/User.ts
- [ ] Create src/data-source.ts
- [ ] Create src/dto/RegisterDto.ts and LoginDto.ts
- [ ] Create src/routes/auth.ts
- [ ] Update src/index.ts

### Phase 3: Migrations & Setup
- [ ] Add typeorm migration scripts
- [ ] Create initial migration
- [ ] Update setup-tests.js to run migrations before tests

### Phase 4: Tests
- [ ] Update test/backend.test.ts with registration test suite

### Phase 5: Verify
- [ ] Run npm test and confirm all pass
