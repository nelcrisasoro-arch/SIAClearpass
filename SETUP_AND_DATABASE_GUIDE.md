# SIA ClearPass: Setup and Database Guide

St. Isidore Academy of Trinidad Bohol, Inc.  
Student Clearance Mobile App and Administrative Web Management System.

---

## 1. Mga Kinahanglan I-install sa Imong Computer (System Requirements)

Aron mapadagan ang SIA ClearPass sa imong local computer, kinahanglan nimo kining mosunod:

1. **Node.js** (Version 18, 20, o 22 LTS)
   * Download gikan sa opisyal nga website: [https://nodejs.org/](https://nodejs.org/)
   * Pagsulay sa terminal/cmd:
     ```bash
     node -v
     npm -v
     ```

2. **Git** (Para sa pag-clone sa project o pag-extract)
   * Download: [https://git-scm.com/](https://git-scm.com/)

3. **PostgreSQL** (Relational Database)
   * Download: [https://www.postgresql.org/download/](https://www.postgresql.org/download/)
   * O kung naggamit ka og Windows, pwede ang **pgAdmin 4** o **PostgreSQL Installer**.

---

## 2. Unsaon Pagpadagan sa Web & Mobile App (Frontend / Expo)

1. **Ablihi ang Terminal / Command Prompt** sa folder sa project:
   ```bash
   cd sia-clearpass
   ```

2. **I-install ang dependencies**:
   ```bash
   npm install
   ```

3. **Padagana ang development server**:
   ```bash
   npm run dev
   ```

4. **Ablihi sa Browser**:
   * Adto sa `http://localhost:3000` (o ang port nga gipakita sa terminal).
   * Makita dayon nimo ang **SIA ClearPass**:
     * **Mobile Simulator** para sa mga Estudyante ug Teachers/Personnel.
     * **Admin Web Portal** para sa School Administrator.

5. **Para sa Expo / Physical Phone Test**:
   * Kung gusto nimo padaganon isip standalone React Native mobile app sa imong Android/iOS phone:
     * I-install ang **Expo Go** app gikan sa Google Play Store o Apple App Store.
     * I-click ang **"Download ZIP"** button sa ibabaw sa app aron makuha ang kumpletong Expo project package.

---

## 3. PostgreSQL Database Commands (Kompleto nga mga Lakang)

Oo, **PostgreSQL (Postgres)** ang gigamit nga relational database alang sa SIA ClearPass.

### Lakang A: Pag-create sa Database gamit ang `psql` (Terminal / Command Prompt)

1. **Pagsulod sa PostgreSQL command line (`psql`)**:
   * Sa Windows (SQL Shell / CMD):
     ```bash
     psql -U postgres
     ```
   * Sa Mac / Linux:
     ```bash
     sudo -u postgres psql
     ```

2. **Paghimo sa Database ug User (I-type sulod sa `psql`)**:
   ```sql
   -- 1. Paghimo sa database para sa ClearPass
   CREATE DATABASE sia_clearpass;

   -- 2. Paghimo sa dedicated user
   CREATE USER sia_admin WITH ENCRYPTED PASSWORD 'sia_password123';

   -- 3. Hatagi og full access ang maong user
   GRANT ALL PRIVILEGES ON DATABASE sia_clearpass TO sia_admin;

   -- 4. Sulod sa bag-ong database
   \c sia_clearpass;
   ```

---

### Lakang B: Pag-import sa Kompleto nga Tables & Schema

Naa na sa project root ang file nga `database_schema.sql` nga adunay tanang tables:
* `users`
* `students` (Grades 7-10 JHS ug Grades 11-12 SHS)
* `personnel` (Science Head, Cashier, Library, Adviser)
* `clearance_forms`
* `clearance_periods`
* `clearance_requirements`
* `student_clearance_records`
* `student_submissions`
* `digital_signatures`
* `notifications`

**Command aron ma-run ang schema file sa usa lang ka linya:**
```bash
psql -U postgres -d sia_clearpass -f database_schema.sql
```

O kung sulod ka na sa `psql (\c sia_clearpass;)`:
```sql
\i database_schema.sql
```

---

### Lakang C: Alternatibo gamit ang Docker (1-Line Setup)

Kung aduna kay **Docker Desktop**, dili na kinahanglan mag-install og manual nga PostgreSQL. I-run lang kini sa terminal:

```bash
docker run --name sia-postgres \
  -e POSTGRES_USER=sia_admin \
  -e POSTGRES_PASSWORD=sia_password123 \
  -e POSTGRES_DB=sia_clearpass \
  -p 5432:5432 \
  -d postgres:16-alpine
```

Ug aron ma-import ang mga tables:
```bash
docker exec -i sia-postgres psql -U sia_admin -d sia_clearpass < database_schema.sql
```

---

## 4. Connection String (`.env`)

Aron makonektar ang imong backend application sa PostgreSQL database, gamita kini sa imong `.env` file:

```env
DATABASE_URL="postgresql://sia_admin:sia_password123@localhost:5432/sia_clearpass"
DB_HOST="localhost"
DB_PORT=5432
DB_USER="sia_admin"
DB_PASSWORD="sia_password123"
DB_NAME="sia_clearpass"
```

---

## 5. Summary sa Default Login Accounts

| Role | Username | Password | Designated Area / Note |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full Admin Portal Access |
| **Science Head** | `nelcris.asoro` | `science123` | Science Department Head & Signatory |
| **Cashier Head** | `carmelita.tan` | `cashier123` | Finance & Cashier Department Head |
| **Head Librarian** | `lourdes.reyes` | `library123` | Learning Resource Center Head |
| **Class Adviser** | `elena.santos` | `adviser123` | Grade 9 Rose Class Adviser |
| **Student** | `joseph.corre` | `0018` | LRN: 117947100018 (Last 4 digits: `0018`) |
