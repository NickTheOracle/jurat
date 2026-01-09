# Jurat PDF Service (XFA)

Java service to generate XFA PDFs for USCIS forms (starting with N-400).

## Run locally

```bash
./gradlew run
```

The service listens on `http://localhost:4567`.

## Endpoint

`POST /fill/n-400`

Request body: JSON with intake fields.  
Response: `application/pdf` filled N-400.

## Deploy

Use the included `Dockerfile` for Render/Railway.

## License note

This service uses iText 5 (AGPL). For production/commercial use, you will need a commercial iText license.
