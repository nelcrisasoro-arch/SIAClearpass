# Giya sa Pagpadagan sa MySQL + Node.js + Express.js (Real-Time APK & Web)

St. Isidore Academy of Trinidad Bohol, Inc.  
SIA ClearPass: Student & Personnel Clearance Management System

---

## 1. Unsay Buhaton sa MySQL Workbench (Step-by-Step Guide)

Tungod kay **MySQL Workbench** ang imong gamiton, sunda kining 5 ka sayon nga mga lakang:

### Lakang 1: Ablihi ang MySQL Workbench
1. Ablihi ang **MySQL Workbench** sa imong computer.
2. Sa home screen, i-click ang imong connection: **"Local instance MySQL80"** (o bisan unsang local connection nimo).
3. I-type ang imong **root password** nga imong gi-set sa pag-install sa MySQL unya i-click ang **OK**.

### Lakang 2: I-load ang `mysql_schema.sql` File
1. Sa menu sa pinaka-ibabaw, i-click ang:
   👉 **File** -> **Open SQL Script...** (o i-press ang shortcut: `Ctrl + Shift + O`).
2. Pangitaa ug pilia ang file nga **`mysql_schema.sql`** nga anaa sulod sa folder sa atong project.
3. Mo-abli ang bag-ong tab sa SQL Editor nga puno sa tanang tables ug default accounts.

### Lakang 3: I-execute ang SQL Script (I-run)
1. Sa ibabaw sa SQL Editor, pangitaa ang **⚡ Lightning Bolt (Kilat)** icon nga walay magnifying glass.
2. I-click ang maong **⚡ Lightning Bolt** icon aron i-execute ang tibuok script.
3. Tan-awa ang **Action Output** panel sa pinaka-ubos sa MySQL Workbench:
   * Makita nimo ang tanang **Green checkmarks (✓)** nga nagpamatuod nga nahimo na ang database nga `sia_clearpass` ug ang tanang 10 ka tables!

### Lakang 4: I-refresh ang Schemas Sidebar
1. Sa wala nga panel (Navigator), i-click ang tab nga **Schemas**.
2. I-right-click ang bisan asang blangko nga bahin unya i-click ang **Refresh All**.
3. Makita na nimo ang **`sia_clearpass`** database! Kung i-click nimo ang arrow sa tupad sa Tables, makita nimo:
   * `users`
   * `students`
   * `personnel`
   * `clearance_forms`
   * `clearance_periods`
   * `clearance_requirements`
   * `student_clearance_records`
   * `clearance_assignments`
   * `digital_signatures`
   * `notifications`

### Lakang 5: Pagsulay sa Pag-query (Test Query)
Sa SQL Query tab, i-type kini ug i-click ang ⚡:
```sql
USE sia_clearpass;
SELECT * FROM users;
SELECT * FROM students;
SELECT * FROM personnel;
```
Makita dayon nimo ang mga data nila:
* **Admin**: `admin` / `admin123`
* Walay initial student/personnel record. Gama ug add sila pinaagi sa Admin Web Portal.

---

## 2. I-set ang Imong MySQL Password sa `.env` File

Sa MySQL Workbench, aduna kay password sa imong `root` user (pananglitan: `root`, `admin`, o imong personal password).  
Ablihi ang `.env` file sa project ug i-update ang `DB_PASSWORD`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=imong_mysql_password_diri
DB_NAME=sia_clearpass
```

---

## 2. Unsaon Pagpadagan sa Node.js + Express.js Server

Naa na tay **`server.ts`** nga nagpadagan sa atong **Full-Stack Express.js API** ug **Real-Time Stream Engine (SSE)**!

1. Sa terminal sa folder sa project:
   ```bash
   npm install
   ```
2. Padagana ang server:
   ```bash
   npm run dev
   ```
3. Makita nimo sa terminal:
   ```
   🚀 [SIA ClearPass] Full-Stack Server running at: http://localhost:3000
   📱 [Mobile APK Endpoint]: http://<YOUR_LOCAL_IP>:3000/api
   ⚡ [Real-time Stream]: http://localhost:3000/api/realtime/stream
   ```

---

## 3. Giunsa Pag-konektar ang Mobile APK sa Cellphone aron Mag-REALTIME sa Web?

Aron magkasumpay ang **Cellphone APK** (Teacher ug Student) ug ang **Laptop Web Portal** (Admin) sa tinuod nga kinabuhi:

### Lakang 1: Siguroha nga Naka-connect ang Cellphone ug Laptop sa Mao Rang Wi-Fi
* I-connect ang imong cellphone ug ang imong laptop sa parehas nga Wi-Fi network (pananglitan: School Wi-Fi, balay Wi-Fi, o Mobile Hotspot).

### Lakang 2: Kuhaa ang Local IP Address sa Imong Laptop
1. Sa Windows, ablihi ang **Command Prompt (cmd)**.
2. I-type:
   ```bash
   ipconfig
   ```
3. Pangitaa ang **IPv4 Address** (pananglitan: `192.168.1.25`).

### Lakang 3: Giunsa Paglihok sa Real-Time Sync?
1. Sa **Teacher's APK** (sa cellphone):
   * Mo-pindot si Teacher Nelcris og **"✍️ Sign"** alang sa clearance ni Joseph Corre.
2. Ang phone magpadala dayon og HTTP POST request sa Express Server:
   `http://192.168.1.25:3000/api/clearance/sign`
3. Ang **Express Server** mo-update dayon sa **MySQL Database**:
   * I-update ang table nga `clearance_assignments` ngadto sa `status = 'Approved'`.
4. Sa mao rang millisecond, ang Express server mo-broadcast sa real-time stream (`/api/realtime/stream`):
   * Ang **Student's APK** sa laing cellphone awtomatikong makadawat sa alert:
     > *"⚡ Real-time Clearance Update: Clearance was signed & approved by a department head!"*
   * Ang **Admin Web Portal** sa laptop awtomatikong mo-update sa iyang Cleared Percentage Statistics nga walay pag-refresh sa browser!
5. Ug kung nasipyat ang teacher, mo-pindot lang siya og **"↩ Undo Sign"**:
   * Mo-send kini sa `/api/clearance/undo`.
   * Awtomatikong ma-revert sa MySQL ngadto sa `With Remarks / Pending`, ug ma-update dayon ang phone sa estudyante ug ang web portal!

---

## 4. Connection Settings (`.env`)

Mahimo nimong usbon ang database settings sa imong `.env` file sumala sa imong local setup:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sia_clearpass
```
*(Sa default nga XAMPP installation, ang `DB_USER` kay `root` ug walay password `DB_PASSWORD=`)*.

---

## 5. Summary sa Default MySQL Accounts

| Role | Username | Password | Full Name / Office |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | ClearPass System Administrator |
| **Student** | Created by Administrator | Set during enrollment | No sample student is preloaded |

## Updated Database and Mobile Sync

The current app starts with the administrator account only. Create student and personnel accounts from the Admin Web Portal. The Express server saves shared app records in MySQL table `clearpass_app_state` (created automatically) and sends `STATE_UPDATED` events over `/api/realtime/stream` so connected web/mobile clients refresh.

For a physical Android phone, set `globalThis.__CLEARPASS_API_BASE_URL__` to the laptop's reachable address (for example, `http://192.168.1.25:3000`) in the mobile app entry point before mounting `ClearPassProvider`. Android emulators default to `http://10.0.2.2:3000`. Use the same API server and MySQL database for all clients.
