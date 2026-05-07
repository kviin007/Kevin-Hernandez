import { GoogleGenAI, Type, Schema } from "@google/genai";
import { safeParse } from "../utils/safeParse";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface NailColor {
  hex: string;
  name: string;
}

export interface NailDesign {
  name: string;
  colors: NailColor[];
  techniques: string[];
  difficulty: "Básico" | "Intermedio" | "Avanzado" | string;
  estimatedTime: string;
  description: string;
}

export interface NailDesignPrompt {
  description: string;
  occasion: string;
  shape: string;
  length: string;
}

export const generateNailDesigns = async (promptData: NailDesignPrompt): Promise<NailDesign[]> => {
  const prompt = `
Ocasión: ${promptData.occasion}
Forma de uña: ${promptData.shape}
Largo: ${promptData.length}
Descripción de la clienta: ${promptData.description}
`;

  const responseSchema: Schema = {
    type: Type.ARRAY,
    description: "Lista de 3 propuestas de diseños de uñas creativos",
    items: {
      type: Type.OBJECT,
      properties: {
        name: {
            type: Type.STRING,
            description: "Nombre creativo e inspirador del diseño (en español)",
        },
        colors: {
            type: Type.ARRAY,
            description: "Paleta de colores sugerida",
            items: {
                type: Type.OBJECT,
                properties: {
                    hex: { type: Type.STRING, description: "Código HEX del color (ej. #FFB6C1)" },
                    name: { type: Type.STRING, description: "Nombre descriptivo del color" }
                },
                required: ["hex", "name"]
            }
        },
        techniques: {
            type: Type.ARRAY,
            description: "Técnicas sugeridas (ej. Degradado, stamping)",
            items: { type: Type.STRING }
        },
        difficulty: {
            type: Type.STRING,
            description: "Nivel de dificultad (Básico, Intermedio, o Avanzado)"
        },
        estimatedTime: {
            type: Type.STRING,
            description: "Tiempo estimado en el salón (ej. 1 hora, 1.5 horas)"
        },
        description: {
            type: Type.STRING,
            description: "Descripción poética y atractiva del diseño en 2 o 3 líneas"
        }
      },
      required: ["name", "colors", "techniques", "difficulty", "estimatedTime", "description"]
    }
  };

  const response = await (ai as any).models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: `Eres una nail artist experta colombiana con 10 años de experiencia. 
Tu tarea es sugerir exactamente 3 diseños de uñas creativos basados en la descripción de la clienta.
Usa nombres creativos en español. Los colores deben ser reales y hermosos. 
El tono es cálido, femenino y entusiasta.`,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.7,
    }
  });

  const text = response.text || '';
  if (!text) {
      throw new Error("No se pudo generar el diseño, intenta de nuevo.");
  }

  return safeParse<NailDesign[]>(text, []);
};
