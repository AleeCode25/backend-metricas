const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const axios = require('axios');
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());                  
app.use(require("cors")());
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Asegura que req.body funcione correctamente
app.use(cookieParser());

// Conexión a MongoDB con manejo de eventos
mongoose.connect("mongodb+srv://reysanto:ReySanto2025Admin@cluster0.crqomp6.mongodb.net/")
  .then(() => {
    console.log('✅ Conexión exitosa a MongoDB Atlas');
  })
  .catch(err => {
    console.error('❌ Error de conexión a MongoDB:', err.message);
  });

// Eventos adicionales de conexión
mongoose.connection.on('connected', () => {
  console.log('🟢 MongoDB conectado');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Error en la conexión de MongoDB:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 MongoDB desconectado');
});

app.post("/mensaje", async (req, res) => {
  const body = req.body;
  const { kommoId, token } = req.query;

  // --- LOGS DE DEPURACIÓN INICIANDO LA RUTA ---
  console.log("🐛 DEBUG: kommoId recibido:", kommoId);
  console.log("🐛 DEBUG: token recibido:", token);
  // ------------------------------------------

  console.log(JSON.stringify(body, null, 2), "← este es lo que devuelve el body");
  const leadId = req.body?.leads?.add?.[0]?.id;

  // --- LOG DE DEPURACIÓN PARA leadId ---
  console.log("🐛 DEBUG: leadId extraído del webhook:", leadId);
  // ------------------------------------

  if (!leadId) {
    return res.status(400).json({
      error: "Lead ID no encontrado",
      detalles: {
        tipo: 'lead_no_encontrado',
        mensaje: "No se encontró el ID del lead en la solicitud",
        timestamp: new Date()
      }
    });
  }

  try {
    const contacto = await obtenerContactoDesdeLead(leadId, kommoId, token);

    if (contacto) {
      console.log("🧾 ID del contacto:", contacto.id);

      // Obtener el lead con sus campos personalizados
      const leadResponse = await axios.get(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=custom_fields_values`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const lead = leadResponse.data;

      const campoMensaje = lead.custom_fields_values?.find(field =>
        field.field_name === "mensajeenviar"
      );
      const mensajeDelCliente = campoMensaje?.values?.[0]?.value;

      console.log("📝 Mensaje guardado en el lead (mensajeenviar):", mensajeDelCliente);

      let mensajeDeRespuesta = "";

      // --- INICIO DE LA LÓGICA DE RESPUESTAS AUTOMÁTICAS ---
      if (mensajeDelCliente) {
        // Poner el mensaje en minúsculas para una comparación sin distinción de mayúsculas
        const mensajeNormalizado = mensajeDelCliente.toLowerCase();

        if (mensajeNormalizado.includes("cargar")) {
          mensajeDeRespuesta = "Hola, nuestro CBU es 123415124123. Por favor, realiza la carga y envíanos el comprobante.";
        } else if (mensajeNormalizado.includes("ayuda") || mensajeNormalizado.includes("soporte")) {
          mensajeDeRespuesta = "Claro, ¿en qué podemos ayudarte? Describe tu problema y un agente se comunicará contigo.";
        } else {
          // Si no coincide con ninguna palabra clave, puedes enviar una respuesta genérica
          mensajeDeRespuesta = "Gracias por tu mensaje. Un agente te responderá en breve.";
        }
      } else {
        console.log("⚠️ No se encontró ningún mensaje en el campo 'mensajeenviar'.");
        return res.status(200).json({ status: "ok", mensaje: "No se encontró un mensaje para procesar." });
      }
      // --- FIN DE LA LÓGICA DE RESPUESTAS AUTOMÁTICAS ---

      console.log("➡️ Mensaje de respuesta generado:", mensajeDeRespuesta);

      // Ahora, actualizamos el lead con el nuevo mensaje en el campo "mensajeenviar"
      const dataToUpdate = {
        custom_fields_values: [
          {
            field_name: "mensajeenviar",
            values: [
              {
                value: mensajeDeRespuesta
              }
            ]
          }
        ]
      };

      // Enviamos la solicitud PATCH a la API de Kommo para actualizar el lead
      await axios.patch(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}`, dataToUpdate, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("✅ Lead actualizado exitosamente con el nuevo mensaje.");

      return res.status(200).json({ status: "ok", mensaje: "Lead actualizado con la respuesta automática." });

    } else {
      // Si no se encuentra el contacto, devuelve un 200 para que Kommo no reintente
      return res.status(200).json({ status: "ok", mensaje: "Contacto no encontrado, no se realiza ninguna acción." });
    }
  } catch (error) {
    console.error("❌ Error en la ruta /mensaje:", error.response?.data || error.message);
    return res.status(500).json({ error: "Error interno del servidor", detalles: error.message });
  }
});

async function obtenerContactoDesdeLead(leadId, kommoId, token) {
  // Aseguramos que se solicite custom_fields_values para el contacto si es necesario
  const url = `https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=contacts`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const lead = response.data;
    const contacto = lead._embedded?.contacts?.[0]; // primer contacto vinculado

    if (!contacto) {
      console.log("⚠️ No se encontró ningún contacto asociado a este lead");
      return null;
    }

    console.log("✅ Contacto vinculado al lead:", contacto);
    return contacto;

  } catch (err) {
    console.error("❌ Error al obtener contacto desde lead:", err.response?.data || err.message);
    return null;
  }
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});