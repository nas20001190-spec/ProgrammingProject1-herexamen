# Competent — Stage Monitoring App

Competent is een webapplicatie voor het opvolgen van stages binnen de opleiding Toegepaste Informatica aan de Erasmushogeschool Brussel (EhB). De applicatie verbindt studenten, docenten, stagementoren en de stagecommissie (admin) in één platform voor stageaanvragen, logboeken, evaluaties en documentbeheer.

## Inhoudstafel

- [Functionaliteiten](#functionaliteiten)
- [Tech stack](#tech-stack)
- [Projectstructuur](#projectstructuur)
- [Installatie](#installatie)
- [Omgevingsvariabelen](#omgevingsvariabelen)
- [Database](#database)
- [Rollen](#rollen)
- [Testgebruikers](#testgebruikers)
- [Git workflow](#git-workflow)
- [Deployment](#deployment)

## Functionaliteiten

**Student**
- Stageaanvraag indienen en opvolgen
- Wekelijks logboek bijhouden (taken, reflectie, uren, competenties)
- Tussentijdse en finale evaluatie bekijken en zelfreflectie invullen
- Documenten raadplegen en uploaden (stageovereenkomst, eindverslag)
- Profiel beheren en wachtwoord wijzigen

**Docent**
- Overzicht van begeleide studenten en hun stage-informatie
- Logboeken van studenten ter opvolging bekijken
- Tussentijdse evaluaties registreren per competentie

**Stagementor**
- Overzicht van toegewezen stagiairs
- Logboeken wekelijks goedkeuren of afkeuren
- Evaluaties invullen per competentie
- Stageovereenkomst digitaal ondertekenen

**Stagecommissie (admin)**
- Stageaanvragen goedkeuren, afkeuren of aanpassingen vragen
- Gebruikersbeheer (studenten, docenten, stagementoren, admins)
- Overzicht van alle overeenkomsten en stages
- Nieuwe gebruikers aanmaken met automatische uitnodigingsmail

**Systeem**
- JWT-authenticatie met rol-gebaseerde toegangscontrole via middleware
- Automatische e-mails bij stagegoedkeuring, -afkeuring en accountactivatie
- Wachtwoord vergeten flow met tijdelijke verificatiecode

## Tech stack

| Onderdeel | Technologie |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS v3 |
| Database | MySQL |
| ORM/Query | mysql2/promise |
| Authenticatie | JWT (jsonwebtoken / jose) + bcryptjs |
| E-mail | Nodemailer (Gmail SMTP) |
| Iconen | lucide-react |

## Projectstructuur

```
programming-project/
  app/
    authentificator/        # Login, wachtwoord vergeten, first-time setup
    api/                    # API routes per rol en functionaliteit
    lib/                    # db.js, auth.js, mailer.js, emailTemplates.js, fetchMetAuth.js
    student/                # Pagina's en componenten voor studenten
    docent/                 # Pagina's en componenten voor docenten
    stagementor/             # Pagina's en componenten voor stagementoren
    admin/                   # Pagina's en componenten voor de stagecommissie
  middleware.js              # Rol-gebaseerde routebeveiliging
  .env.local                 # Lokale omgevingsvariabelen (niet op GitHub)
  tailwind.config.js
  postcss.config.js
```

## Installatie

```bash
git clone https://github.com/Bilal1906/Programming-Project.git
cd Programming-Project/Programming-Project/programming-project
npm install
```

Maak een `.env.local` bestand aan (zie [Omgevingsvariabelen](#omgevingsvariabelen)) en start de development server:

```bash
npm run dev
```

De applicatie is beschikbaar op `http://localhost:3000`.

## Omgevingsvariabelen

Maak een `.env.local` bestand aan in de map `programming-project/` met de volgende variabelen:

```
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_PORT=
DB_NAME=

JWT_SECRET=

GMAIL_USER=
GMAIL_APP_PASSWORD=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`SMTP_PASS` is een Gmail App-wachtwoord (vereist 2-staps-verificatie op het Gmail-account), niet het normale accountwachtwoord.

## Database

De database draait op MySQL. De belangrijkste tabellen zijn: `user`, `student`, `docent`, `bedrijf`, `stagementor`, `admin`, `stage`, `logboek_week`, `logboek_dag`, `competentie`, `logboek_dag_competentie`, `evaluatie`, `evaluatie_score`, `document`, `probleem` en `notificatie`.

Voor wachtwoord-reset en accountactivatie zijn twee extra kolommen vereist op de `user` tabel:

```sql
ALTER TABLE user ADD COLUMN reset_code VARCHAR(10);
ALTER TABLE user ADD COLUMN reset_code_expiry DATETIME;
```

Voor documentstatus en -type op de `document` tabel:

```sql
ALTER TABLE document
ADD COLUMN status VARCHAR(50) DEFAULT 'in_afwachting',
ADD COLUMN type VARCHAR(50) DEFAULT 'stageovereenkomst',
ADD COLUMN ondertekend_op DATETIME NULL;
```

## Rollen

| Rol | Toegang |
|---|---|
| `student` | `/student/*` |
| `docent` | `/docent/*` |
| `stagementor` | `/stagementor/*` |
| `admin` | `/admin/*` |

Toegang wordt afgedwongen via `middleware.js` op basis van het JWT-token in de cookies.

## Testgebruikers

| Rol | E-mail | Wachtwoord |
|---|---|---|
| Student | bilal.jaaboub@ehb.be | ww123 |
| Docent | joachim.quartier@ehb.be | ww123 |
| Stagementor | steve.weemaels@proximus.be | password123 |
| Admin | admin@ehb.be | wachtwoord123 |

## Git workflow

Het team werkt met feature branches die via pull requests gemerged worden naar `main`:

```bash
git checkout -b feature/naam-van-feature
# wijzigingen committen
git push origin feature/naam-van-feature
# pull request aanmaken en mergen op GitHub
```

`.env.local`, `node_modules` en `.next` staan in `.gitignore` en worden nooit gecommit.

## Deployment

De applicatie wordt gehost op een virtuele machine, aangevraagd bij de ICT-dienst van de EhB. Zowel de webserver (Next.js) als de MySQL-database draaien op deze VM. De omgevingsvariabelen in `.env.local` verwijzen naar het IP-adres en de credentials van deze VM in productie.