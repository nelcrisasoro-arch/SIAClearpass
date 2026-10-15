# Giya sa Pagpadagan sa Expo Go ug Pag-build og Standalone Android APK (.apk)

St. Isidore Academy of Trinidad Bohol, Inc.  
SIA ClearPass: Student & Personnel Clearance Mobile App

---

## 1. Nganong `.tsx` ang File Extension?

Sa **React Native** ug **Expo**, ang opisyal nga gigamit nga standard mao ang **TypeScript JSX (`.tsx`)**.  
* Ang `.tsx` nagpasabot nga **TypeScript + React Native components** (sama sa `<View>`, `<Text>`, `<TouchableOpacity>`, `<TextInput>`, `<ScrollView>`).
* Ang tibuok mobile application sa SIA ClearPass (`MobileAppRootRN.tsx`, `LoginScreenRN.tsx`, `StudentHomeScreenRN.tsx`, `PersonnelSignatureScreenRN.tsx`) mga tinuod nga **React Native** components nga modagan sa Android ug iOS.

---

## 2. Unsaon Pagpadagan sa Imong Telepono gamit ang Expo Go

Aron masulayan nimo ang mobile app sa imong tinuod nga Android o iPhone:

1. **I-download ang Expo Go app**:
   * Sa imong Android phone, ablihi ang Google Play Store ug i-search ang **Expo Go** unya i-install.

2. **Sa imong Computer / Laptop (Terminal)**:
   * I-extract o ablihi ang folder sa project.
   * I-install ang dependencies:
     ```bash
     npm install
     ```
   * Padagana ang Expo:
     ```bash
     npx expo start
     ```

3. **I-konek sa imong Phone**:
   * Adunay mogawas nga dako nga **QR Code** sa imong terminal o browser.
   * Ablihi ang **Expo Go app** sa imong Android phone, i-tap ang **"Scan QR code"**, ug i-tutok sa screen sa imong laptop.
   * Awtomatikong mag-load ang **SIA ClearPass** sa imong cellphone!

---

## 3. Unsaon Paghimo og Direct Standalone Android APK (`.apk`)

Kung gusto nimo og tinuod nga installer file nga `.apk` aron ma-share sa mga estudyante ug maestra bisan walay Expo Go:

Gigamit nato ang opisyal nga tool sa Expo nga gitawag og **EAS Build (Expo Application Services)**:

### Lakang 1: I-install ang EAS CLI
Sa imong computer terminal:
```bash
npm install -g eas-cli
```

### Lakang 2: Pag-login sa Expo Account
(Kung wala pa kay Expo account, libre kini paghimo sa [https://expo.dev/signup](https://expo.dev/signup)):
```bash
eas login
```

### Lakang 3: I-configure ang Project alang sa APK Build
I-run kini kausa sa folder sa project:
```bash
eas build:configure
```

Siguroha nga ang imong `eas.json` adunay `preview` profile nga naka-set sa `"buildType": "apk"`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

### Lakang 4: I-build ang APK File!
I-type kini nga command sa imong terminal:
```bash
eas build -p android --profile preview
```

### Unsay Mahitabo Human sa Command?
1. I-upload sa EAS ang imong React Native project sa Expo Cloud Builder.
2. Awtomatiko kining i-compile ngadto sa **`.apk`** file (mga 5 hangtod 10 minutos).
3. Pagkahuman, hatagan ka sa terminal og **Direct Download Link** (ug QR code) sa imong `.apk` file (pananglitan: `sia-clearpass.apk`).
4. I-download kini sa imong cellphone ug i-install!

---

## 4. PostgreSQL Database: Online ba o Naa sa Docker?

Ang **PostgreSQL** usa ka database engine:
1. **Lokal nga Paggamit (Development / Thesis Presentation)**:
   * **Docker (Girekomenda - Dali ra kaayo)**:
     ```bash
     docker run --name sia-postgres -e POSTGRES_USER=sia_admin -e POSTGRES_PASSWORD=sia_password123 -e POSTGRES_DB=sia_clearpass -p 5432:5432 -d postgres:16-alpine
     ```
   * O i-install diretso sa Windows pinaagi sa [PostgreSQL Official Installer](https://www.postgresql.org/download/).
2. **Online / Cloud Database (Kung gusto nimo ma-access bisan asa)**:
   * Pwede kang mogamit og libreng online cloud PostgreSQL sama sa:
     * **Supabase** ([https://supabase.com](https://supabase.com)) - Libreng hosted PostgreSQL.
     * **Neon Tech** ([https://neon.tech](https://neon.tech)) - Libreng serverless PostgreSQL.
   * Ibutang lang ang connection string sa imong `.env`:
     ```env
     DATABASE_URL="postgresql://user:password@host:5432/sia_clearpass"
     ```
