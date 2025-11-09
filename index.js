const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const RegistroAlan = require("./models/RegistroAlan");
const RegistroRochy = require("./models/RegistroRochy");
const RegistroNeon = require("./models/RegistroNeon");
const RegistroDobleAs = require("./models/RegistroDobleAs");
const RegistroJoker = require("./models/RegistroJoker");
const RegistroCash = require("./models/RegistroCash");
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

const isValidIP = (ip) => {
  const regex =
    /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  return regex.test(ip);
};

app.post("/crearusuario", async (req, res) => {
  // 1. OBTENER DATOS INICIALES
  const { kommoId, token } = req.query;
  const leadId = req.body?.leads?.add?.[0]?.id;

  console.log(`➡️  Iniciando /crearusuario para Lead ID: ${leadId}`);

  if (!leadId || !kommoId || !token) {
    console.error("❌ Faltan datos esenciales: leadId, kommoId o token.");
    return res.status(400).json({ error: "Faltan parámetros (leadId, kommoId, token)." });
  }
  
  let MENSAJEENVIAR_FIELD_ID;
  let api_token;

  if (kommoId === "opendrust090") {
    MENSAJEENVIAR_FIELD_ID = 780468;
    api_token = "c9a837bc0cfe1113a8867b7d105ab0087b59b785c0a2d28ac2717ce520931ce2";
  } else if (kommoId === "neonvip") {
    MENSAJEENVIAR_FIELD_ID = 1407554;
    api_token = "649f298de66e450f91b68832d3701d76a2862c5403d0b71acc072c2b79b87ed9";
  }

  try {
    // 2. CREAR USUARIO EN LA PLATAFORMA EXTERNA
    const formData = new FormData();
    formData.append("group", "5");
    formData.append("sended", "true");
    formData.append("name", "");
    formData.append("login", "");
    formData.append("password", "");
    formData.append("balance", "");
    formData.append("api_token", api_token);

    const apiResponse = await axios.post(
      "https://admin.reysanto.com/index.php?act=admin&area=createuser&response=js", 
      formData
    );
    const apiData = apiResponse.data;

    // 3. VERIFICAR RESPUESTA Y ACTUALIZAR KOMMO
    if (apiData.success) {
      const loginGenerado = apiData.id;
      const passwordGenerada = apiData.password;
      console.log(`✅ Usuario creado en sistema externo . Login: ${loginGenerado}`);

      // Creamos el mensaje que se va a enviar
      const mensajeDeRespuesta = `Hola, tu usuario es: ${loginGenerado} y tu contraseña es: ${passwordGenerada}.`;

      // Preparamos los datos para Kommo USANDO EL FIELD_ID
      const dataToUpdate = {
        custom_fields_values: [
          {
            field_id: MENSAJEENVIAR_FIELD_ID, // <-- ¡ESTA ES LA CORRECCIÓN CLAVE!
            values: [{ value: mensajeDeRespuesta }]
          }
        ]
      };

      console.log(`🔄  Actualizando lead ${leadId} con el nuevo mensaje...`);
      await axios.patch(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}`, dataToUpdate, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("✅ Lead actualizado exitosamente en Kommo.");
      return res.status(200).json({ status: "ok", mensaje: "Usuario creado y lead actualizado." });

    } else {
      // Si la creación del usuario falla
      const errorMessage = apiData.errorMessage || "La API externa no devolvió un error específico.";
      console.error("❌ Error de la API externa:", errorMessage);
      return res.status(400).json({
        error: "Fallo en la creación del usuario.",
        detalles: errorMessage
      });
    }
  } catch (error) {
    // Si falla cualquier llamada de red (axios) o hay otro error
    const errorDetails = error.response?.data || error.message;
    console.error("❌ Error fatal en la ruta /crearusuario:", errorDetails);
    return res.status(500).json({
      error: "Error interno del servidor.",
      detalles: errorDetails
    });
  }
});

app.post("/guardar", async (req, res) => {
  try {
    const { id, token, pixel, ip, fbclid, mensaje } =
      req.body;

    const { kommoId } = req.query;

    // 1. Verificación de campos obligatorios
    if (!id || !token || !pixel || !ip) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // 2. Validación de tipos y formatos
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "ID debe ser numérico" });
    }

    if (!isValidIP(ip)) {
      return res.status(400).json({ error: "IP no es válida" });
    }

    let existente;
    
    if (kommoId === "opendrust090") {
      existente = await RegistroAlan.findOne({ id });
    } else if (kommoId === "urbanjadeok") {
      existente = await RegistroRochy.findOne({ id });
    } else if (kommoId === "neonvip") {
      existente = await RegistroNeon.findOne({ id });
    } else if (kommoId === "kommo202513") {
      existente = await RegistroDobleAs.findOne({ id });
    } else if (kommoId === "conline") {
      existente = await RegistroJoker.findOne({ id });
    } else if (kommoId === "cashlangos") {
      existente = await RegistroCash.findOne({ id });
    } else {
      return res.status(400).json({ error: "ID de Kommo no reconocido" });
    }

    if (existente) {
      return res.status(409).json({ error: "Este ID ya fue registrado" });
    }

    let nuevoRegistro;

    if (kommoId === "opendrust090") {
      nuevoRegistro = new RegistroAlan({
        id,
        token,
        pixel,
        ip,
        fbclid,
        mensaje,
      });

      await nuevoRegistro.save();
    } else if (kommoId === "urbanjadeok") {
      nuevoRegistro = new RegistroRochy({
        id,
        token,
        pixel,
        ip,
        fbclid,
        mensaje,
      });

      await nuevoRegistro.save();
    } else if (kommoId === "neonvip") {
      nuevoRegistro = new RegistroNeon({
        id,
        token,
        pixel,
        ip,
        fbclid,
        mensaje,
      });

      await nuevoRegistro.save();
    } else if (kommoId === "kommo202513") {
      nuevoRegistro = new RegistroDobleAs({
        id,
        token,
        pixel,
        ip,
        fbclid,
        mensaje,
      });

      await nuevoRegistro.save();
    } else if (kommoId === "conline") {
      nuevoRegistro = new RegistroJoker({
        id,
        token,
        pixel,
        ip,
        fbclid,
        mensaje,
      });

      await nuevoRegistro.save();
    } else if (kommoId === "cashlangos") {
      nuevoRegistro = new RegistroCash({
        id,
        token,
        pixel,
        ip,
        fbclid,
        mensaje,
      });
      await nuevoRegistro.save();
    } else {
      return res.status(400).json({ error: "ID de Kommo no reconocido" });
    }

    res.status(201).json({ mensaje: "Datos guardados con éxito" });

    console.log("✅ Registro guardado:", nuevoRegistro);
    console.log("kommoId:", kommoId);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno al guardar los datos" });
  }
});

app.post("/verificacion", async (req, res) => {
  const body = req.body;
  const { kommoId, token , kommoIddoble } = req.query;

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

  const contacto = await obtenerContactoDesdeLead(leadId, kommoId, token);

  if (contacto) {
    console.log("🧾 ID del contacto:", contacto.id);

    const leadResponse = await axios.get(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=custom_fields_values`, { // Añadido ?with=custom_fields_values
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const lead = leadResponse.data;

    // --- LOG DE DEPURACIÓN PARA el objeto lead completo ---
    console.log("🐛 DEBUG: Objeto lead COMPLETO devuelto por Kommo API:", JSON.stringify(lead, null, 2));
    // ----------------------------------------------------

    let campoMensaje = lead.custom_fields_values?.find(field =>
      field.field_name === "mensajeenviar"
    );
    let mensaje = campoMensaje?.values?.[0]?.value;

    // --- LOGS DE DEPURACIÓN PARA campoMensaje y mensaje ---
    console.log("🐛 DEBUG: Valor de 'campoMensaje' encontrado:", JSON.stringify(campoMensaje, null, 2));
    console.log("🐛 DEBUG: Valor final de 'mensaje' antes de regex:", mensaje);
    // ---------------------------------------------------

    console.log("📝 Mensaje guardado en el lead (mensajeenviar):", mensaje);

    const idExtraido = mensaje?.match(/\d{13,}/)?.[0];
    console.log("🧾 ID extraído del mensaje:", idExtraido); //cambios

    if (idExtraido) {
      let Modelo;

      if(kommoId === "opendrust090" && kommoIddoble === "kommo202513"){
        Modelo = RegistroDobleAs;
      } else if (kommoId === "opendrust090") {
        Modelo = RegistroAlan;
      } else if (kommoId === "urbanjadeok") {
        Modelo = RegistroRochy;
      } else if (kommoId === "neonvip") {
        Modelo = RegistroNeon;
      } else if (kommoId === "kommo202513") {
        Modelo = RegistroDobleAs;
      } else if (kommoId === "conline") {
        Modelo = RegistroJoker;
      } else if (kommoId === "cashlangos") {
        Modelo = RegistroCash;
      } else {
        return res.status(400).json({
          error: "ID de Kommo no reconocido",
          detalles: {
            tipo: 'kommo_id_no_reconocido',
            mensaje: `El ID de Kommo '${kommoId}' no es reconocido`,
            timestamp: new Date()
          }
        });
      }

      try {
        let registro = await Modelo.findOne({ id: idExtraido });

        if (registro) {
          console.log("✅ Registro encontrado:", registro);

          if (registro.isVerified) {
            return console.log("Registro ya pixeleado")
          }

          // Obtener el número de WhatsApp del contacto
          const whatsappNumber = contacto.custom_fields_values?.find(field =>
            field.field_code === "PHONE" || field.field_name?.toLowerCase().includes("whatsapp")
          )?.values?.[0]?.value;

          if (whatsappNumber) {
            registro.whatsappNumber = whatsappNumber;
            console.log("📱 Número de WhatsApp guardado:", whatsappNumber);
          }

          // Intentamos verificar el registro
          try {
            // Generar fbc, fbp y event_id
            const cookies = req.cookies;
            const fbclid = registro.fbclid;

            const fbc = cookies._fbc || (fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}` : null);
            const fbp = cookies._fbp || `fb.1.${Math.floor(Date.now() / 1000)}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            const event_id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

            // Marcar como verificado
            registro.isVerified = true;
            registro.verificationStatus = 'verificado';
            await registro.save();

            // URL con el parámetro access_token correctamente
            const pixelEndpointUrl = `https://graph.facebook.com/v18.0/${registro.pixel}/events?access_token=${registro.token}`;

            const eventData = {
              event_name: "LeadCorrectoJoker",
              event_id,
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_source_url: `https://${kommoId}.kommo.com/`,
              user_data: {
                client_ip_address: registro.ip,
                client_user_agent: req.headers["user-agent"],
                em: registro.email ? require("crypto").createHash("sha256").update(registro.email).digest("hex") : undefined,
                fbc,
                fbp
              },
            };

            console.log("Datos del evento a enviar:", JSON.stringify(eventData, null, 2));
            console.log("URL del Pixel:", pixelEndpointUrl);

            const pixelResponse = await axios.post(
              pixelEndpointUrl,
              {
                data: [eventData],
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            console.log("📡 Pixel ejecutado con éxito:", pixelResponse.data);
            return res.status(200).json({
              mensaje: "Verificación completada exitosamente",
              estado: "verificado"
            });

          } catch (error) {
            console.error("❌ Error al ejecutar el pixel:", error.response?.data || error.message);

            // Actualizar el registro con el error
            registro.isVerified = false;
            registro.verificationStatus = 'fallido';
            registro.verificationError = {
              tipo: 'pixel_error',
              mensaje: error.response?.data?.error?.message || error.message,
              timestamp: new Date()
            };
            await registro.save();

            if (error.response) {
              console.error("Estado del error:", error.response.status);
              console.error("Encabezados del error:", error.response.headers);
              console.error("Datos del error:", error.response.data);
            } else if (error.request) {
              console.error("No se recibió respuesta del servidor:", error.request);
            } else {
              console.error("Error desconocido:", error.message);
            }

            return res.status(500).json({
              error: "Error al ejecutar el pixel",
              detalles: registro.verificationError
            });
          }
        } else {
          console.log("❌ No se encontró un registro con ese ID");
          return res.status(404).json({
            error: "Registro no encontrado",
            detalles: {
              tipo: 'registro_no_encontrado',
              mensaje: `No se encontró un registro con el ID ${idExtraido}`,
              timestamp: new Date()
            }
          });
        }
      } catch (error) {
        console.error("Error al buscar o actualizar el registro:", error);
        return res.status(500).json({
          error: "Error interno",
          detalles: {
            tipo: 'error_interno',
            mensaje: error.message,
            timestamp: new Date()
          }
        });
      }
    } else {
      console.log("⚠️ No se pudo extraer un ID del mensaje");
      return res.status(400).json({
        error: "ID no encontrado",
        detalles: {
          tipo: 'id_no_encontrado',
          mensaje: "No se pudo extraer un ID válido del mensaje",
          timestamp: new Date()
        }
      });
    }
  }

  return res.status(400).json({
    error: "Contacto no encontrado",
    detalles: {
      tipo: 'contacto_no_encontrado',
      mensaje: "No se pudo obtener la información del contacto",
      timestamp: new Date()
    }
  });
});

app.post("/vip", async (req, res) => {
  const body = req.body;
  const { kommoId, token , kommoIddoble } = req.query;

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

  const contacto = await obtenerContactoDesdeLead(leadId, kommoId, token);

  if (contacto) {
    console.log("🧾 ID del contacto:", contacto.id);

    const leadResponse = await axios.get(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=custom_fields_values`, { // Añadido ?with=custom_fields_values
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const lead = leadResponse.data;

    // --- LOG DE DEPURACIÓN PARA el objeto lead completo ---
    console.log("🐛 DEBUG: Objeto lead COMPLETO devuelto por Kommo API:", JSON.stringify(lead, null, 2));
    // ----------------------------------------------------

    let campoMensaje = lead.custom_fields_values?.find(field =>
      field.field_name === "mensajeenviar"
    );
    let mensaje = campoMensaje?.values?.[0]?.value;

    // --- LOGS DE DEPURACIÓN PARA campoMensaje y mensaje ---
    console.log("🐛 DEBUG: Valor de 'campoMensaje' encontrado:", JSON.stringify(campoMensaje, null, 2));
    console.log("🐛 DEBUG: Valor final de 'mensaje' antes de regex:", mensaje);
    // ---------------------------------------------------

    console.log("📝 Mensaje guardado en el lead (mensajeenviar):", mensaje);

    const idExtraido = mensaje?.match(/\d{13,}/)?.[0];
    console.log("🧾 ID extraído del mensaje:", idExtraido); //cambios

    if (idExtraido) {
      let Modelo;

      if(kommoId === "opendrust090" && kommoIddoble === "kommo202513"){
        Modelo = RegistroDobleAs;
      } else if (kommoId === "opendrust090") {
        Modelo = RegistroAlan;
      } else if (kommoId === "urbanjadeok") {
        Modelo = RegistroRochy;
      } else if (kommoId === "neonvip") {
        Modelo = RegistroNeon;
      } else if (kommoId === "kommo202513") {
        Modelo = RegistroDobleAs;
      } else if (kommoId === "conline") {
        Modelo = RegistroJoker;
      } else if (kommoId === "cashlangos") {
        Modelo = RegistroCash;
      } else {
        return res.status(400).json({
          error: "ID de Kommo no reconocido",
          detalles: {
            tipo: 'kommo_id_no_reconocido',
            mensaje: `El ID de Kommo '${kommoId}' no es reconocido`,
            timestamp: new Date()
          }
        });
      }

      try {
        let registro = await Modelo.findOne({ id: idExtraido });

        if (registro) {
          console.log("✅ Registro encontrado:", registro);

          if (registro.isVerified) {
            return console.log("Registro ya pixeleado")
          }

          // Obtener el número de WhatsApp del contacto
          const whatsappNumber = contacto.custom_fields_values?.find(field =>
            field.field_code === "PHONE" || field.field_name?.toLowerCase().includes("whatsapp")
          )?.values?.[0]?.value;

          if (whatsappNumber) {
            registro.whatsappNumber = whatsappNumber;
            console.log("📱 Número de WhatsApp guardado:", whatsappNumber);
          }

          // Intentamos verificar el registro
          try {
            // Generar fbc, fbp y event_id
            const cookies = req.cookies;
            const fbclid = registro.fbclid;

            const fbc = cookies._fbc || (fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}` : null);
            const fbp = cookies._fbp || `fb.1.${Math.floor(Date.now() / 1000)}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            const event_id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

            // Marcar como verificado
            registro.isVerified = true;
            registro.verificationStatus = 'verificado';
            await registro.save();

            // URL con el parámetro access_token correctamente
            const pixelEndpointUrl = `https://graph.facebook.com/v18.0/${registro.pixel}/events?access_token=${registro.token}`;

            const eventData = {
              event_name: "LeadCorrectoJoker",
              event_id,
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_source_url: `https://${kommoId}.kommo.com/`,
              user_data: {
                client_ip_address: registro.ip,
                client_user_agent: req.headers["user-agent"],
                em: registro.email ? require("crypto").createHash("sha256").update(registro.email).digest("hex") : undefined,
                fbc,
                fbp
              },
            };

            console.log("Datos del evento a enviar:", JSON.stringify(eventData, null, 2));
            console.log("URL del Pixel:", pixelEndpointUrl);

            const pixelResponse = await axios.post(
              pixelEndpointUrl,
              {
                data: [eventData],
              },
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );

            console.log("📡 Pixel ejecutado con éxito:", pixelResponse.data);
            return res.status(200).json({
              mensaje: "Verificación completada exitosamente",
              estado: "verificado"
            });

          } catch (error) {
            console.error("❌ Error al ejecutar el pixel:", error.response?.data || error.message);

            // Actualizar el registro con el error
            registro.isVerified = false;
            registro.verificationStatus = 'fallido';
            registro.verificationError = {
              tipo: 'pixel_error',
              mensaje: error.response?.data?.error?.message || error.message,
              timestamp: new Date()
            };
            await registro.save();

            if (error.response) {
              console.error("Estado del error:", error.response.status);
              console.error("Encabezados del error:", error.response.headers);
              console.error("Datos del error:", error.response.data);
            } else if (error.request) {
              console.error("No se recibió respuesta del servidor:", error.request);
            } else {
              console.error("Error desconocido:", error.message);
            }

            return res.status(500).json({
              error: "Error al ejecutar el pixel",
              detalles: registro.verificationError
            });
          }
        } else {
          console.log("❌ No se encontró un registro con ese ID");
          return res.status(404).json({
            error: "Registro no encontrado",
            detalles: {
              tipo: 'registro_no_encontrado',
              mensaje: `No se encontró un registro con el ID ${idExtraido}`,
              timestamp: new Date()
            }
          });
        }
      } catch (error) {
        console.error("Error al buscar o actualizar el registro:", error);
        return res.status(500).json({
          error: "Error interno",
          detalles: {
            tipo: 'error_interno',
            mensaje: error.message,
            timestamp: new Date()
          }
        });
      }
    } else {
      console.log("⚠️ No se pudo extraer un ID del mensaje");
      return res.status(400).json({
        error: "ID no encontrado",
        detalles: {
          tipo: 'id_no_encontrado',
          mensaje: "No se pudo extraer un ID válido del mensaje",
          timestamp: new Date()
        }
      });
    }
  }

  return res.status(400).json({
    error: "Contacto no encontrado",
    detalles: {
      tipo: 'contacto_no_encontrado',
      mensaje: "No se pudo obtener la información del contacto",
      timestamp: new Date()
    }
  });
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

        if (mensajeNormalizado === "cargar") {
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