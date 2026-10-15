# MASTER GIYA: Gikan sa MySQL Database, Node.js Server, Hangtod sa Pag-build ug Pag-connect sa Real-Time Android APK (.apk)

**St. Isidore Academy of Trinidad Bohol, Inc.**  
**SIA ClearPass: Student & Personnel Clearance Management System**

---

## 📋 SUMMARY SA ARCHITECTURE (GIUNSA PAGLIHOK)

* **MySQL Database (MySQL Workbench)**: Nagpundo sa tanang records, accounts, clearances, ug digital signatures.
* **Node.js + Express.js Server (`server.ts`)**: Nagdagan sa imong laptop. Mao kini ang "utok" nga modawat sa requests gikan sa mga cellphone ug mo-broadcast sa mga updates gamit ang **Real-Time Stream (SSE)**.
* **Admin Web Portal**: Modagan sa browser sa laptop alang sa Registrar ug Administrator.
* **Standalone Android APK (`.apk`)**: Gi-install diretso sa mga cellphone sa mga Maestra (Personnel) ug mga Estudyante nga **WALAY Expo Go**.
* **Real-Time Wi-Fi Sync**: Inig pirma ni Teacher Nelcris sa iyang cellphone APK, ang cellphone ni Joseph Corre (estudyante) ug ang laptop sa Admin **awtomatikong mo-update sa mao rang segundo** nga walay manual refresh!

---

# BAHIN 1: Pag-setup sa Database sa MySQL Workbench

### 1. Ablihi ang MySQL Workbench
* Ablihi ang **MySQL Workbench** sa imong computer.
* I-click ang imong local connection (**"Local instance MySQL80"**).
* I-type ang imong **root password** unya i-click ang **OK**.

### 2. I-load ang SQL Schema
* Sa menu sa ibabaw, i-click ang **File** ➔ **Open SQL Script...** (o i-press ang `Ctrl + Shift + O`).
* Pilia ang file nga **`mysql_schema.sql`** gikan sa atong project folder.

### 3. I-execute (I-run) ang Script
* Pangitaa ug i-click ang **⚡ Lightning Bolt (Kilat)** icon sa ibabaw sa SQL Editor.
* Tan-awa sa ubos ang **Action Output**: Makita nimo ang tanang **Green checkmarks (✓)**.

### 4. I-verify ang Database
* Sa Navigator panel sa wala, i-click ang **Schemas** ➔ i-right-click ug pilia ang **Refresh All**.
* Makita na nimo ang database nga **`sia_clearpass`** nga adunay 10 ka tables:
  `users`, `students`, `personnel`, `clearance_forms`, `clearance_periods`, `clearance_requirements`, `student_clearance_records`, `clearance_assignments`, `digital_signatures`, `notifications`.

---

# BAHIN 2: Pag-configure sa `.env` File

1. Ablihi ang file nga **`.env`** sa main project folder gamit ang Notepad o VS Code.
   *(Kung dili makita, i-on sa Windows File Explorer: View ➔ Show ➔ Hidden items)*.
2. Ibutang ang imong MySQL password:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=imong_mysql_password_diri
   DB_NAME=sia_clearpass
   ```
   *(Kung walay password ang imong MySQL root, pasagdi lang nga blangko: `DB_PASSWORD=`)*.

---

# BAHIN 3: Pagpadagan sa Node.js + Express Server sa Laptop

1. Ablihi ang **Command Prompt (CMD)** o **Terminal** sulod sa project folder.
2. I-install ang dependencies (kausa ra kini buhaton):
   ```bash
   npm install
   ```
3. Padagana ang server:
   ```bash
   npm run dev
   ```
4. Makita nimo kini nga confirmation message:
   ```
   🚀 [SIA ClearPass] Full-Stack Server running at: http://localhost:3000
   📱 [Mobile APK Endpoint]: http://<YOUR_LOCAL_IP>:3000/api
   ⚡ [Real-time Stream]: http://localhost:3000/api/realtime/stream
   ```
5. Ablihi ang imong browser sa laptop ug bisitaha ang: **`http://localhost:3000`** aron makita ang Admin Web Portal!

---

# BAHIN 4: Pag-build og Standalone Android APK (`.apk`) nga Walay Expo Go

Aron makahimo ka og tinuod nga installer file nga `.apk` nga pwede i-install sa bisan unsang Android phone:

### 1. I-install ang EAS CLI sa Imong Computer
Sa bag-ong terminal window, i-type:
```bash
npm install -g eas-cli
```

### 2. Pag-login sa Imong Libreng Expo Account
```bash
eas login
```
*(Kung wala pa kay account, pag-sign up og libre sa https://expo.dev/signup)*.

### 3. I-build ang Standalone APK File!
Naa na tay giandam nga **`eas.json`** ug **`app.json`** nga naka-set alang sa direct `.apk`. I-type lang kini nga command:
```bash
eas build -p android --profile preview
```

### 4. Unsay Mahitabo Human sa Command?
1. I-compile sa Expo Cloud ang imong React Native app ngadto sa usa ka installer file nga **`.apk`**.
2. Modagan kini og mga 5 hangtod 10 minutos.
3. Inig human, hatagan ka sa terminal og **Direct Download Link** ug **QR Code**.
4. I-download ang **`.apk`** file (e.g. `sia-clearpass.apk`) sa imong cellphone ug i-install!

---

# BAHIN 5: Pag-konektar sa Cellphone APK ngadto sa Laptop aron Mag-REALTIME

Aron magkasinabot ang cellphone ug ang laptop sa parehas nga kwarto o eskwelahan:

### 1. I-konek ang Cellphone ug Laptop sa Parehas nga Wi-Fi
* Pwede sa School Wi-Fi, balay Wi-Fi, o **i-on ang Personal Hotspot sa cellphone unya i-connect ang laptop**.

### 2. Kuhaa ang Local IPv4 Address sa Imong Laptop
1. Sa laptop, ablihi ang **Command Prompt (CMD)**.
2. I-type ang:
   ```bash
   ipconfig
   ```
3. Pangitaa ang **IPv4 Address** (Pananglitan: `192.168.1.25`).
4. Ang imong API URL mao kini:
   👉 **`http://192.168.1.25:3000/api`**

### 3. Windows Firewall Tip
Kung mangutana ang Windows Firewall kung tugotan ba ang **Node.js**, i-click ang **Allow Access** (Private & Public networks).

---

# BAHIN 6: LIVE DEMONSTRATION / DEFENSE SCENARIO (Giunsa Paglihok)

Mao kini ang imong ipakita sa inyong Thesis / Capstone Defense:

1. **Setup**:
   * **Device 1 (Laptop)**: Naka-abli ang Admin Web Portal (`http://localhost:3000`).
   * **Device 2 (Cellphone A)**: Naka-install ang APK ni Teacher **Nelcris Asoro** (Science Head).
   * **Device 3 (Cellphone B)**: Naka-install ang APK ni Estudyante **Joseph Corre**.

2. **Lakang sa Pag-test**:
   * Sa Cellphone A, mag-login si Teacher Nelcris (`nelcris.asoro` / `science123`).
   * Sa Cellphone B, mag-login si Student Joseph (`joseph.corre` / `0018`).
   * Sa Cellphone A, adtoon ni Teacher Nelcris ang **Clearance Records** ➔ pangitaon si Joseph Corre ➔ i-tap ang **"✍️ Sign"**.
   * **ANG MAHITABO SA MAO RANG SEGUNDO (REAL-TIME)**:
     1. Ang cellphone ni Teacher Nelcris mo-save sa MySQL database.
     2. Ang cellphone ni Student Joseph **awtomatikong mo-tingog (audio chime)** ug mogawas ang push notification:  
        *"⚡ Real-time Clearance Update: Clearance was signed & approved by a department head!"*
     3. Ang clearance status ni Joseph mahimong **Approved**.
     4. Ang **Laptop sa Admin** awtomatikong mo-update sa iyang Cleared Statistics chart **nga walay manual refresh**!

3. **Pagsulay sa "Rendo / Undo Sign" (Kung Nasipyat ang Maestra)**:
   * Sa Cellphone A, i-tap ni Teacher Nelcris ang **"↩ Undo Sign"**.
   * Ibutang ang rason: *"Aduna pay kulang nga laboratory equipment"*.
   * I-confirm ang undo.
   * **Real-time Result**: Awtomatikong mabalik sa **"Pending / With Remarks"** ang status sa cellphone sa estudyante ug sa laptop sa Admin!

---

# 🔑 TABLE SA MGA PRE-LOADED ACCOUNTS

| Role | Username | Password | Deskripsyon |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | ClearPass Admin Web Portal (Laptop) |
| **Science Dept Head** | `nelcris.asoro` | `science123` | Science Signatory (Teacher APK) |
| **School Cashier** | `carmelita.tan` | `cashier123` | Finance & Tuitions Signatory (Teacher APK) |
| **Head Librarian** | `lourdes.reyes` | `library123` | Library Clearance Signatory (Teacher APK) |
| **Student** | `joseph.corre` | `0018` | Grade 9 Rose (LRN: `117947100018`, Pass: `0018`) |
