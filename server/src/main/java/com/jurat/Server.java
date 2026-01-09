package com.jurat;

import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.pdf.AcroFields;
import com.itextpdf.text.pdf.PdfReader;
import com.itextpdf.text.pdf.PdfStamper;
import spark.Request;
import spark.Response;
import spark.Spark;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

public class Server {
    private static final Gson GSON = new Gson();
    private static final Type MAP_TYPE = new TypeToken<Map<String, Object>>() {}.getType();

    public static void main(String[] args) {
        String port = System.getenv("PORT");
        if (port != null && !port.isBlank()) {
            Spark.port(Integer.parseInt(port));
        }

        Spark.after((req, res) -> {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Content-Type");
        });

        Spark.options("/*", (req, res) -> {
            res.status(204);
            return "";
        });

        Spark.get("/health", (req, res) -> "ok");

        Spark.post("/fill/n-400", (req, res) -> handleN400(req, res));
    }

    private static Object handleN400(Request req, Response res) throws IOException, DocumentException {
        Map<String, Object> payload = parseJson(req.body());
        byte[] templateBytes = readTemplate("templates/N-400.pdf");

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfReader reader = new PdfReader(templateBytes);
        PdfStamper stamper = new PdfStamper(reader, outputStream);
        stamper.setFormFlattening(false);
        AcroFields form = stamper.getAcroFields();

        Map<String, String> fields = buildFieldMap(payload);
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            form.setField(entry.getKey(), entry.getValue());
        }

        stamper.close();
        reader.close();

        res.type("application/pdf");
        res.header("Content-Disposition", "attachment; filename=\"N-400.pdf\"");
        return outputStream.toByteArray();
    }

    private static Map<String, Object> parseJson(String body) {
        if (body == null || body.isBlank()) {
            return new HashMap<>();
        }
        return GSON.fromJson(body, MAP_TYPE);
    }

    private static byte[] readTemplate(String path) throws IOException {
        InputStream stream = Server.class.getClassLoader().getResourceAsStream(path);
        if (stream == null) {
            throw new IOException("Template not found: " + path);
        }
        return stream.readAllBytes();
    }

    private static Map<String, String> buildFieldMap(Map<String, Object> payload) {
        Map<String, String> fields = new HashMap<>();
        String lastName = upper(stringValue(payload.get("lastName")));
        String firstName = upper(stringValue(payload.get("firstName")));
        String middleName = upper(stringValue(payload.get("middleName")));
        String dob = upper(stringValue(payload.get("formattedDateOfBirth")));
        String prDate = upper(stringValue(payload.get("formattedDateBecamePermanentResident")));
        String alienNumber = upper(stringValue(payload.get("alienNumber")));
        String uscisAccount = upper(stringValue(payload.get("uscisAccountNumber")));
        String birthCountry = upper(stringValue(payload.get("countryOfBirth")));
        String citizenship = upper(stringValue(payload.get("citizenship")));
        String addressNumber = upper(stringValue(payload.get("addressNumber")));
        String addressStreet = upper(stringValue(payload.get("addressStreet")));
        String city = upper(stringValue(payload.get("city")));
        String state = upper(stringValue(payload.get("state")));
        String zip = upper(stringValue(payload.get("zipCode")));
        String country = upper(stringValue(payload.get("country")));
        String phone = upper(stringValue(payload.get("phone")));
        String email = upper(stringValue(payload.get("email")));
        String ssn = upper(stringValue(payload.get("ssn")));

        fields.put("form1[0].#subform[1].Part2Line3_FamilyName[0]", lastName);
        fields.put("form1[0].#subform[1].Part2Line4a_GivenName[0]", firstName);
        fields.put("form1[0].#subform[1].Part2Line4a_MiddleName[0]", middleName);
        fields.put("form1[0].#subform[1].P2_Line8_DateOfBirth[0]", dob);
        fields.put("form1[0].#subform[1].P2_Line9_DateBecamePermanentResident[0]", prDate);
        fields.put("form1[0].#subform[1].P2_Line10_CountryOfBirth[0]", birthCountry);
        fields.put("form1[0].#subform[1].P2_Line11_CountryOfNationality[0]", citizenship);
        fields.put("form1[0].#subform[1].P2_Line6_USCISELISAcctNumber[0]", uscisAccount);
        fields.put("form1[0].#subform[8].P9_Line22c_SSNumber[0]", ssn);

        fields.put("form1[0].#subform[2].P4_Line1_Number[0]", addressNumber);
        fields.put("form1[0].#subform[2].P4_Line1_StreetName[0]", addressStreet);
        fields.put("form1[0].#subform[2].P4_Line1_City[0]", city);
        fields.put("form1[0].#subform[2].P4_Line1_State[0]", state);
        fields.put("form1[0].#subform[2].P4_Line1_ZipCode[0]", zip);
        fields.put("form1[0].#subform[2].P4_Line1_Country[0]", country);

        fields.put("form1[0].#subform[10].P12_Line3_Telephone[0]", phone);
        fields.put("form1[0].#subform[10].P12_Line5_Email[0]", email);

        // Fill all A-number copies.
        fields.put("form1[0].#subform[0].#area[0].Line1_AlienNumber[0]", alienNumber);
        fields.put("form1[0].#subform[1].#area[1].Line1_AlienNumber[1]", alienNumber);
        fields.put("form1[0].#subform[2].#area[2].Line1_AlienNumber[2]", alienNumber);
        fields.put("form1[0].#subform[3].#area[3].Line1_AlienNumber[3]", alienNumber);
        fields.put("form1[0].#subform[4].#area[4].Line1_AlienNumber[4]", alienNumber);
        fields.put("form1[0].#subform[5].#area[6].Line1_AlienNumber[5]", alienNumber);
        fields.put("form1[0].#subform[6].#area[7].Line1_AlienNumber[6]", alienNumber);
        fields.put("form1[0].#subform[7].#area[8].Line1_AlienNumber[7]", alienNumber);
        fields.put("form1[0].#subform[8].#area[9].Line1_AlienNumber[8]", alienNumber);
        fields.put("form1[0].#subform[9].#area[10].Line1_AlienNumber[9]", alienNumber);
        fields.put("form1[0].#subform[10].#area[11].Line1_AlienNumber[10]", alienNumber);
        fields.put("form1[0].#subform[11].#area[12].Line1_AlienNumber[11]", alienNumber);
        fields.put("form1[0].#subform[12].#area[13].Line1_AlienNumber[12]", alienNumber);
        fields.put("form1[0].#subform[13].#area[14].Line1_AlienNumber[13]", alienNumber);

        return fields;
    }

    private static String stringValue(Object value) {
        if (value == null) {
            return "";
        }
        return value.toString().trim();
    }

    private static String upper(String value) {
        return value == null ? "" : value.toUpperCase();
    }
}
