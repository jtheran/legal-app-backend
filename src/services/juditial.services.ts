import config from "../config/config";
import axios from "axios";
import puppeteer from "puppeteer";
import { createAuditLog } from "./audit.services";
const pdf = require("pdf-parse");

const options = {
    headless: true,
    args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu"
    ]
}


export const checkJudicialStates = async (radicados: string[]) => {
    const browser = await puppeteer.launch(options);
    const page = await browser.newPage();

    try{
        await page.goto(config.SCRAPPER_JUDITIAL_URL);
        const pdfUrl = await page.evaluate(() => {
            const link = document.querySelector('a[href$=".pdf"]'); // Selector genérico
            return link ? (link as HTMLAnchorElement).href : null;
        });

        if (!pdfUrl) throw new Error("No se encontró el PDF de estados hoy");

        // 3. Descargar el PDF en memoria
        const response: any = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
        const dataBuffer = Buffer.from(response.data);

        const pdfData = await pdf(dataBuffer);
        const pdfText = pdfData.text.toUpperCase();

        // 5. Buscar coincidencias
        const matches = radicados.filter(rad => pdfText.includes(rad.toUpperCase()));

        return {
            matches,
            pdfUrl,
            rawText: pdfText
        };
      
    }catch(err: any){
        createAuditLog({
            action: "Scrapper",
            description: "Error al scrapper"+err.message,
            resource: "Juditial",
            userAgent: "Puppeter",
            status: "FAILED"
        });
        
    }
}