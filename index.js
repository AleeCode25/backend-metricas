const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const RegistroAlan = require("./models/RegistroAlan");
const RegistroAlanUru = require("./models/RegistroAlanUru");
const RegistroRochy = require("./models/RegistroRochy");
const RegistroNeon = require("./models/RegistroNeon");
const RegistroDobleAs = require("./models/RegistroDobleAs");
const RegistroJoker = require("./models/RegistroJoker");
const RegistroCash = require("./models/RegistroCash");
const RegistroAzar = require("./models/RegistroAzar");
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
    } else if (kommoId === "marygobert2026") {
      existente = await RegistroAlanUru.findOne({ id });
    } else if (kommoId === "urbanjadeok") {
      existente = await RegistroRochy.findOne({ id });
    } else if (kommoId === "neonvip") {
      existente = await RegistroNeon.findOne({ id });
    } else if (kommoId === "kommo202513") {
      existente = await RegistroDobleAs.findOne({ id });
    } else if (kommoId === "conline") {
      existente = await RegistroJoker.findOne({ id });
    } else if (kommoId === "woncoinbots2") {
      existente = await RegistroCash.findOne({ id });
    } else if (kommoId === "azlpublic6") {
      existente = await RegistroAzar.findOne({ id });
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
        leadId: "",
      });

      await nuevoRegistro.save();
    } else if (kommoId === "marygobert2026") {
      nuevoRegistro = new RegistroAlanUru({
        id,
        token,
        pixel,
        ip,
        fbclid,
        mensaje,
        leadId: "",
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
        leadId: "",
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
    } else if (kommoId === "woncoinbots2") {
      nuevoRegistro = new RegistroCash({
        id,
        token,
        pixel,
        ip,
        fbclid,
        mensaje,
        leadId: "",
      });
      await nuevoRegistro.save();
    } else if (kommoId === "azlpublic6") {
      nuevoRegistro = new RegistroAzar({
        id,
        token,
        pixel,
        ip,
        fbclid,
        mensaje,
        leadId: "",
      }); 
      await nuevoRegistro.save();
    } else {
      return res.status(400).json({ error: "ID de Kommo no reconocido" });
    }

    res.status(201).json({ mensaje: "Datos guardados con éxito" });

    if(res.statusCode !== 201){
      console.error("❌ Error al guardar los datos, código de estado:", res.statusCode);
    }

    console.log("✅ Registro guardado:", nuevoRegistro);
    console.log("kommoId:", kommoId);

    

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno al guardar los datos" });
  }
});

app.post("/verificacion", async (req, res) => {
  const body = req.body;
  const { kommoId, token, kommoIddoble } = req.query;

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

      if (kommoId === "opendrust090" && kommoIddoble === "kommo202513") {
        Modelo = RegistroDobleAs;
      } else if (kommoId === "opendrust090") {
        Modelo = RegistroAlan;
      } else if (kommoId === "marygobert2026") {
        Modelo = RegistroAlanUru;
      } else if (kommoId === "urbanjadeok") {
        Modelo = RegistroRochy;
      } else if (kommoId === "neonvip") {
        Modelo = RegistroNeon;
      } else if (kommoId === "kommo202513") {
        Modelo = RegistroDobleAs;
      } else if (kommoId === "conline") {
        Modelo = RegistroJoker;
      } else if (kommoId === "woncoinbots2") {
        Modelo = RegistroCash;
      } else if (kommoId === "azlpublic6") {
        Modelo = RegistroAzar;
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

            if (kommoId === "opendrust090" || kommoId === "woncoinbots2" || kommoId === "marygobert2026" || kommoId === "azlpublic6" || kommoId === "urbanjadeok" ) {
              console.log("aca entro uno que se le crea el leadId")
              registro.leadId = leadId.toString();
              await registro.save();

              console.log("Registro guardado con nuevo leadId:", registro.leadId);
            }

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
  const { kommoId, token } = req.query;

  // --- LOGS DE DEPURACIÓN INICIANDO LA RUTA ---
  console.log("🐛 DEBUG: ENTRO POR EL VIP");
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

  // ***************************************************************
  // AHORA TODA LA LÓGICA PRINCIPAL VA DENTRO DE ESTE 'if'
  // ***************************************************************
  if (contacto) {
    console.log("🧾 ID del contacto:", contacto.id);

    const leadResponse = await axios.get(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=custom_fields_values`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // 'lead' se define aquí y estará disponible para todo lo que sigue dentro de este bloque
    const lead = leadResponse.data;

    // --- LOG DE DEPURACIÓN PARA el objeto lead completo ---
    console.log("🐛 DEBUG: Objeto lead COMPLETO devuelto por Kommo API:", JSON.stringify(lead, null, 2));
    console.log("🐛 DEBUG: lead.price : ", lead.price);
    // ----------------------------------------------------

    let Modelo;

    if (kommoId === "opendrust090") {
      Modelo = RegistroAlan;
    } else if (kommoId === "woncoinbots2") {
      Modelo = RegistroCash;
    } else if (kommoId === "marygobert2026") {
      Modelo = RegistroAlanUru;
    } else if (kommoId === "azlpublic6") {
      Modelo = RegistroAzar;
    } else if (kommoId === "urbanjadeok") {
      Modelo = RegistroRochy;
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
      let registro = await Modelo.findOne({ leadId: leadId });

      if (registro) {
        console.log("✅ Registro encontrado:", registro);

        try {

          const cookies = req.cookies;
          const fbclid = registro.fbclid;

          const fbc = cookies._fbc || (fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${fbclid}` : null);
          const fbp = cookies._fbp || `fb.1.${Math.floor(Date.now() / 1000)}.${Math.floor(1000000000 + Math.random() * 9000000000)}`;
          const event_id = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

          // ***************************************************************
          // ESTA LÍNEA AHORA FUNCIONARÁ PORQUE 'lead' ESTÁ EN SCOPE
          // ***************************************************************
          if ((lead.price >= 2000 && kommoId === "opendrust090") || (lead.price >= 2000 && kommoId === "woncoinbots2") || (lead.price >= 2000 && kommoId === "azlpublic6") || (lead.price >= 2000 && kommoId === "urbanjadeok")) {

            if (lead.price >= 50000) {
              console.log("El lead califica como Mega VIP, procediendo con el pixel Mega Vip.");
            } else if (lead.price >= 20000) {
              console.log("El lead califica como Ultra VIP, procediendo con el pixel Ultra Vip.");
            } else if (lead.price >= 10000) {
              console.log("El lead es VIP, procediendo con el pixel VIP.");
            } else {
              console.log("El lead es CLIENTE.");
            }

            // URL con el parámetro access_token correctamente
            const pixelEndpointUrl = `https://graph.facebook.com/v18.0/${registro.pixel}/events?access_token=${registro.token}`;

            const eventData = {
              event_name: lead.price >= 50000 ? "MegaVIP" : lead.price >= 20000 ? "ClientesUltraVIP" : lead.price >= 10000 ? "ClientesVIP" : "Cliente",
              event_id, // Usando el event_id definido arriba
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_source_url: `https://777fortunavip.com/`,
              user_data: {
                client_ip_address: registro.ip,
                client_user_agent: "Server-side",
                fbc: registro.fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${registro.fbclid}` : null,
                fbp: `fb.1.${Math.floor(Date.now() / 1000)}.${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                em: registro.email ? require("crypto").createHash("sha256").update(registro.email).digest("hex") : undefined,
              },
              custom_data: {
                currency: "ARS",
                value: lead.price
              },
              // event_id: `vip_${Date.now()}_${Math.random().toString(36).substring(2, 10)}` // Ojo: estabas definiendo event_id dos veces. Usamos el de arriba.
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

            console.log("📡 Pixel VIP ejecutado con éxito:", pixelResponse.data);
            return res.status(200).json({
              mensaje: "Verificación completada exitosamente",
              estado: "verificado"
            });
          } else if (lead.price >= 2000 && kommoId === "marygobert2026") {

            if (lead.price >= 6000) {
              console.log("El lead califica como Mega VIP Uru, procediendo con el pixel Mega Vip.");
            } else if (lead.price >= 4000) {
              console.log("El lead califica como Ultra VIP Uru, procediendo con el pixel Ultra Vip.");
            } else {
              console.log("El lead es VIP Uru, procediendo con el pixel VIP.");
            }

            // URL con el parámetro access_token correctamente
            const pixelEndpointUrl = `https://graph.facebook.com/v18.0/${registro.pixel}/events?access_token=${registro.token}`;

            const eventData = {
              event_name: lead.price >= 6000 ? "MegaVIP" : lead.price >= 4000 ? "ClientesUltraVIP" : "ClientesVIP",
              event_id, // Usando el event_id definido arriba
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_source_url: `https://777fortuna.win/`,
              user_data: {
                client_ip_address: registro.ip,
                client_user_agent: "Server-side",
                fbc: registro.fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${registro.fbclid}` : null,
                fbp: `fb.1.${Math.floor(Date.now() / 1000)}.${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                em: registro.email ? require("crypto").createHash("sha256").update(registro.email).digest("hex") : undefined,
              },
              custom_data: {
                currency: "ARS",
                value: lead.price
              },
              // event_id: `vip_${Date.now()}_${Math.random().toString(36).substring(2, 10)}` // Ojo: estabas definiendo event_id dos veces. Usamos el de arriba.
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

            console.log("📡 Pixel VIP de Uru ejecutado con éxito:", pixelResponse.data);
            return res.status(200).json({
              mensaje: "Verificación completada exitosamente",
              estado: "verificado"
            });

          } else {
            console.log("El lead no cumple con el valor mínimo para VIP.");
            return res.status(400).json({
              error: "El lead no cumple con el valor mínimo para VIP.",
              detalles: {
                tipo: 'valor_minimo_no_cumplido',
                mensaje: `El valor del lead es ${lead.price}, se requiere al menos 10000.`,
                timestamp: new Date()
              }
            });
          }

        } catch (error) {
          console.error("❌ Error al ejecutar el pixel:", error.response?.data || error.message);

          // Actualizar el registro con el error
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
            mensaje: `No se encontró un registro con el ID ${leadId}`,
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

  } // --- FIN DEL BLOQUE 'if (contacto)' ---

  // Si el código llega aquí, es porque 'contacto' era falso (null o undefined)
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

  if (kommoId === "lafortuna") {
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
        name: loginGenerado,
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

app.post("/mensajecarga", async (req, res) => {
  // 1. OBTENER DATOS INICIALES
  const { kommoId, token } = req.query;
  const leadId = req.body?.leads?.add?.[0]?.id;

  console.log(`➡️  Iniciando /mensajecarga para Lead ID: ${leadId}`);

  if (!leadId || !kommoId || !token) {
    console.error("❌ Faltan datos esenciales: leadId, kommoId o token.");
    return res.status(400).json({ error: "Faltan parámetros (leadId, kommoId, token)." });
  }

  let MENSAJEENVIAR_FIELD_ID;
  let api_token;

  if (kommoId === "lafortuna") {
    MENSAJEENVIAR_FIELD_ID = 1902536;
    api_token = "c9a837bc0cfe1113a8867b7d105ab0087b59b785c0a2d28ac2717ce520931ce2";
  } else if (kommoId === "neonvip") {
    MENSAJEENVIAR_FIELD_ID = 1407554;
    api_token = "649f298de66e450f91b68832d3701d76a2862c5403d0b71acc072c2b79b87ed9";
  }

  try {

    const mensajesDeAcreditacionYPromocion = [
      "Todo en orden, ya podés arrancar, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo preparado, podés iniciar cuando quieras, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, empezá con confianza, mucha energía positiva ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo ok, podés arrancar ahora, que te vaya excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo en marcha, podés comenzar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo preparado, podés dar inicio, que tengas una gran jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés empezar ya, lo mejor para vos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo acomodado, arrancá con calma, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés comenzar con confianza, que sea productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Ya está todo preparado, podés arrancar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo en orden, podés empezar ya, que tengas un día genial ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés iniciar cuando quieras, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo preparado, comenzá con confianza, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés arrancar seguro, que te vaya excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo en marcha, ya podés empezar, que sea un día positivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo acomodado, podés iniciar ya, fuerza para hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo perfecto, podés arrancar tranquilo, que tengas un día productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés dar inicio ya, éxitos en la jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo organizado, podés comenzar con calma, que sea un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo preparado, ya podés arrancar, mucha fuerza hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo en orden, podés iniciar cuando quieras, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, arrancá tranquilo, que tengas un día excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo preparado, podés empezar ya, lo mejor en tu jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo acomodado, podés arrancar seguro, éxitos en la carga ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés iniciar ya, que te vaya genial hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo en orden, podés comenzar tranquilo, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo preparado, arrancá ya, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo perfecto, podés empezar con confianza, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés iniciar tranquilo, que sea un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo preparado, podés comenzar ya, mucha energía ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo en orden, podés arrancar tranquilo, que sea un día excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés iniciar ya, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo acomodado, podés arrancar cuando quieras, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo preparado, podés comenzar con confianza, que sea positivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo perfecto, podés iniciar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés arrancar ya, que sea una buena jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo en marcha, podés comenzar cuando quieras, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo preparado, podés dar inicio ya, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés empezar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo acomodado, podés arrancar con calma, que sea productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo en orden, podés iniciar ya, lo mejor para vos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo listo, podés arrancar seguro, que sea una gran jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF",
      "Todo preparado, podés comenzar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/CoMa4sVZIHaAQMsZYKaDpF"
    ];

    const mensajeDeRespuesta = obtenerMensajeAlAzar(mensajesDeAcreditacionYPromocion);

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
    console.log("Mensaje seleccionado:", mensajeDeRespuesta);
    console.log("token y kommoId usados:", token, kommoId);
    console.log("dataToUpdate:", JSON.stringify(dataToUpdate, null, 2));
    await axios.patch(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}`, dataToUpdate, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ Lead actualizado exitosamente en Kommo.");
    return res.status(200).json({ status: "ok", mensaje: "Usuario creado y lead actualizado." });
  } catch (error) {
    // Acceder a los detalles del error de la respuesta HTTP
    const errorResponseData = error.response?.data;
    const errorDetails = errorResponseData || error.message;

    console.error("❌ Error fatal en la ruta /mensajecarga:", errorDetails);

    // ------------------------------------------------------------------
    // 💡 NUEVO CÓDIGO CLAVE: INTENTAR IMPRIMIR EL ARRAY DE VALIDACIÓN
    // ------------------------------------------------------------------
    if (errorResponseData && errorResponseData['validation-errors']) {
      console.error("🛑 DETALLES DE VALIDACIÓN DE KOMMO:");

      // Intentamos imprimir el primer error que Kommo te está devolviendo
      errorResponseData['validation-errors'].forEach((validationError, index) => {
        console.error(`Error de Validación #${index}:`, validationError.errors);
      });
    }
    // ------------------------------------------------------------------

    return res.status(500).json({
      error: "Error interno del servidor.",
      detalles: errorDetails
    });
  }
});

app.post("/cargar", async (req, res) => {
  // 1. OBTENER DATOS INICIALES
  const body = req.body;
  const { kommoId, token } = req.query;
  const leadId = req.body?.leads?.add?.[0]?.id;

  console.log(JSON.stringify(body, null, 2), "← este es lo que devuelve el body");
  console.log(`➡️  Iniciando /cargar para Lead ID: ${leadId}`);


  if (!leadId || !kommoId || !token) {
    console.error("❌ Faltan datos esenciales: leadId, kommoId o token.");
    return res.status(400).json({ error: "Faltan parámetros (leadId, kommoId, token)." });
  }

  let MENSAJEENVIAR_FIELD_ID;
  let api_token;

  if (kommoId === "lafortuna") {
    MENSAJEENVIAR_FIELD_ID = 1902536;
    api_token = "c9a837bc0cfe1113a8867b7d105ab0087b59b785c0a2d28ac2717ce520931ce2";
  } else if (kommoId === "neonvip") {
    MENSAJEENVIAR_FIELD_ID = 1407554;
    api_token = "649f298de66e450f91b68832d3701d76a2862c5403d0b71acc072c2b79b87ed9";
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

      console.log("contacto obtenido:", contacto);
      console.log("Propiedades del lead obtenido:", lead);

      const customFieldMonto = lead.custom_fields_values?.find(field => field.field_name === 'MONTO A CARGAR');

      const customFieldPlataforma = lead.custom_fields_values?.find(field => field.field_name === 'PLATAFORMA');

      const nombreDelLead = lead.name;
      const montoACargar = customFieldMonto?.values?.[0]?.value;
      const plataformaSeleccionada = customFieldPlataforma?.values?.[0]?.value.toLowerCase()

      console.log("👤 Nombre del usuario extraido:", nombreDelLead);
      console.log("💰 Monto a cargar extraído:", montoACargar);
      console.log("🎰 Plataforma seleccionada extraída:", plataformaSeleccionada);

      if (!montoACargar || isNaN(montoACargar) || montoACargar <= 0) {
        console.error("❌ Monto a cargar inválido:", montoACargar);
        return res.status(400).json({ error: "Monto a cargar inválido." });
      }

      if (!plataformaSeleccionada || (plataformaSeleccionada !== 'rey santo' && plataformaSeleccionada !== 'fortuna')) {
        console.error("❌ Plataforma seleccionada inválida:", plataformaSeleccionada);
        return res.status(400).json({ error: "Plataforma seleccionada inválida." });
      }

      if (plataformaSeleccionada === 'fortuna') {
        api_token = "c9a837bc0cfe1113a8867b7d105ab0087b59b785c0a2d28ac2717ce520931ce2";
      } else if (plataformaSeleccionada === 'rey santo') {
        api_token = "ec6ab03d2199969f8e3b7a2319a68ce743a30f06eb20422922d454839b619e2b";
      }

      try {
        // 2. REALIZAR LA CARGA EN LA PLATAFORMA EXTERNA
        const formData = new FormData();
        formData.append("amount", montoACargar);
        formData.append("balance_currency", "ARS");
        formData.append("send", "true");
        formData.append("all", "false");
        formData.append("operation", "in");
        formData.append("api_token", api_token);

        let cargaResponse;

        if (plataformaSeleccionada === 'fortuna') {
          cargaResponse = await axios.post(
            `https://admin.777fortuna.vip/index.php?act=admin&area=balance&type=frame&id=${nombreDelLead}&response=js`,
            formData
          );
        } else if (plataformaSeleccionada === 'rey santo') {
          cargaResponse = await axios.post(
            `https://admin.reysanto.com/index.php?act=admin&area=balance&type=frame&id=${nombreDelLead}&response=js`,
            formData
          );
        }


        const cargaData = cargaResponse.data;

        if (cargaData.successMessage) {

          console.log(`✅ Carga de ${montoACargar} realizada exitosamente en ${plataformaSeleccionada} para el usuario ${nombreDelLead}.`);

          // Crear el mensaje de confirmación

          try {

            const mensajesDeAcreditacionYPromocion = [
              "Todo en orden, ya podés arrancar, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés iniciar cuando quieras, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, empezá con confianza, mucha energía positiva ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo ok, podés arrancar ahora, que te vaya excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en marcha, podés comenzar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés dar inicio, que tengas una gran jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés empezar ya, lo mejor para vos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo acomodado, arrancá con calma, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés comenzar con confianza, que sea productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Ya está todo preparado, podés arrancar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en orden, podés empezar ya, que tengas un día genial ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés iniciar cuando quieras, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, comenzá con confianza, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés arrancar seguro, que te vaya excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en marcha, ya podés empezar, que sea un día positivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo acomodado, podés iniciar ya, fuerza para hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo perfecto, podés arrancar tranquilo, que tengas un día productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés dar inicio ya, éxitos en la jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo organizado, podés comenzar con calma, que sea un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, ya podés arrancar, mucha fuerza hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en orden, podés iniciar cuando quieras, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, arrancá tranquilo, que tengas un día excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés empezar ya, lo mejor en tu jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo acomodado, podés arrancar seguro, éxitos en la carga ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés iniciar ya, que te vaya genial hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en orden, podés comenzar tranquilo, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, arrancá ya, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo perfecto, podés empezar con confianza, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés iniciar tranquilo, que sea un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés comenzar ya, mucha energía ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en orden, podés arrancar tranquilo, que sea un día excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés iniciar ya, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo acomodado, podés arrancar cuando quieras, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés comenzar con confianza, que sea positivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo perfecto, podés iniciar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés arrancar ya, que sea una buena jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en marcha, podés comenzar cuando quieras, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés dar inicio ya, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés empezar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo acomodado, podés arrancar con calma, que sea productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en orden, podés iniciar ya, lo mejor para vos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés arrancar seguro, que sea una gran jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés comenzar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16"
            ];

            const mensajeDeRespuesta = obtenerMensajeAlAzar(mensajesDeAcreditacionYPromocion);

            // Preparamos los datos para Kommo USANDO EL FIELD_ID
            const dataToUpdate = {
              custom_fields_values: [
                {
                  field_id: MENSAJEENVIAR_FIELD_ID, // <-- ¡ESTA ES LA CORRECCIÓN CLAVE!
                  values: [{ value: mensajeDeRespuesta }]
                }
              ],
              customFieldMonto
            };

            console.log(`🔄  Actualizando lead ${leadId} con el nuevo mensaje...`);
            console.log("Mensaje seleccionado:", mensajeDeRespuesta);
            console.log("token y kommoId usados:", token, kommoId);
            console.log("dataToUpdate:", JSON.stringify(dataToUpdate, null, 2));
            await axios.patch(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}`, dataToUpdate, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            console.log("✅ Lead actualizado exitosamente en Kommo.");
            return res.status(200).json({ status: "ok", mensaje: "Usuario creado y lead actualizado." });
          } catch (error) {
            // Acceder a los detalles del error de la respuesta HTTP
            const errorResponseData = error.response?.data;
            const errorDetails = errorResponseData || error.message;

            console.error("❌ Error fatal en la ruta /mensajecarga:", errorDetails);

            // ------------------------------------------------------------------
            // 💡 NUEVO CÓDIGO CLAVE: INTENTAR IMPRIMIR EL ARRAY DE VALIDACIÓN
            // ------------------------------------------------------------------
            if (errorResponseData && errorResponseData['validation-errors']) {
              console.error("🛑 DETALLES DE VALIDACIÓN DE KOMMO:");

              // Intentamos imprimir el primer error que Kommo te está devolviendo
              errorResponseData['validation-errors'].forEach((validationError, index) => {
                console.error(`Error de Validación #${index}:`, validationError.errors);
              });
            }
            // ------------------------------------------------------------------

            return res.status(500).json({
              error: "Error interno del servidor.",
              detalles: errorDetails
            });
          }


        } else {
          const errorMessage = cargaData.errorMessage || "La API externa no devolvió un error específico.";
          console.error("❌ Error de la API externa durante la carga:", errorMessage);
          return res.status(400).json({
            error: "Fallo en la carga del usuario.",
            detalles: errorMessage
          });
        }
      } catch (error) {
        const errorDetails = error.response?.data || error.message;
        console.error("❌ Error al realizar la carga en la plataforma externa:", errorDetails);
        return res.status(500).json({
          error: "Error interno del servidor durante la carga.",
          detalles: errorDetails
        });
      }

    }
  } catch (error) {
    console.error("❌ Error en la ruta /cargar:", error.response?.data || error.message);
    return res.status(500).json({ error: "Error interno del servidor", detalles: error.message });
  }
});

app.post("/retirar", async (req, res) => {
  // 1. OBTENER DATOS INICIALES
  const body = req.body;
  const { kommoId, token } = req.query;
  const leadId = req.body?.leads?.add?.[0]?.id;

  console.log(JSON.stringify(body, null, 2), "← este es lo que devuelve el body");
  console.log(`➡️  Iniciando /retirar para Lead ID: ${leadId}`);


  if (!leadId || !kommoId || !token) {
    console.error("❌ Faltan datos esenciales: leadId, kommoId o token.");
    return res.status(400).json({ error: "Faltan parámetros (leadId, kommoId, token)." });
  }

  let MENSAJEENVIAR_FIELD_ID;
  let api_token;

  if (kommoId === "lafortuna") {
    MENSAJEENVIAR_FIELD_ID = 1902536;
  } else if (kommoId === "neonvip") {
    MENSAJEENVIAR_FIELD_ID = 1407554;
    api_token = "649f298de66e450f91b68832d3701d76a2862c5403d0b71acc072c2b79b87ed9";
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

      console.log("contacto obtenido:", contacto);
      console.log("Propiedades del lead obtenido:", lead);

      const customFieldMonto = lead.custom_fields_values?.find(field => field.field_name === 'MONTO A RETIRAR');

      const customFieldPlataforma = lead.custom_fields_values?.find(field => field.field_name === 'PLATAFORMA');

      const nombreDelLead = lead.name;
      const montoACargar = customFieldMonto?.values?.[0]?.value;
      const plataformaSeleccionada = customFieldPlataforma?.values?.[0]?.value.toLowerCase()

      console.log("👤 Nombre del usuario extraido:", nombreDelLead);
      console.log("💰 Monto a retirar extraído:", montoACargar);
      console.log("🎰 Plataforma seleccionada extraída:", plataformaSeleccionada);

      if (!montoACargar || isNaN(montoACargar) || montoACargar <= 0) {
        console.error("❌ Monto a retirar inválido:", montoACargar);
        return res.status(400).json({ error: "Monto a retirar inválido." });
      }

      if (!plataformaSeleccionada || (plataformaSeleccionada !== 'rey santo' && plataformaSeleccionada !== 'fortuna')) {
        console.error("❌ Plataforma seleccionada inválida:", plataformaSeleccionada);
        return res.status(400).json({ error: "Plataforma seleccionada inválida." });
      }

      if (plataformaSeleccionada === 'fortuna') {
        api_token = "c9a837bc0cfe1113a8867b7d105ab0087b59b785c0a2d28ac2717ce520931ce2";
      } else if (plataformaSeleccionada === 'rey santo') {
        api_token = "ec6ab03d2199969f8e3b7a2319a68ce743a30f06eb20422922d454839b619e2b";
      }

      try {
        // 2. REALIZAR LA CARGA EN LA PLATAFORMA EXTERNA
        const formData = new FormData();
        formData.append("amount", montoACargar);
        formData.append("balance_currency", "ARS");
        formData.append("send", "true");
        formData.append("all", "false");
        formData.append("operation", "out");
        formData.append("api_token", api_token);

        const cargaResponse = await axios.post(
          `https://admin.reysanto.com/index.php?act=admin&area=balance&type=frame&id=${nombreDelLead}&response=js`,
          formData
        );

        const cargaData = cargaResponse.data;

        if (cargaData.successMessage) {

          console.log(`✅ Retiro de ${montoACargar} realizada exitosamente en ${plataformaSeleccionada} para el usuario ${nombreDelLead}.`);

          // Crear el mensaje de confirmación

          try {

            const mensajesDeAcreditacionYPromocion = [
              "Todo en orden, ya podés arrancar, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés iniciar cuando quieras, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, empezá con confianza, mucha energía positiva ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo ok, podés arrancar ahora, que te vaya excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en marcha, podés comenzar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés dar inicio, que tengas una gran jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés empezar ya, lo mejor para vos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo acomodado, arrancá con calma, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés comenzar con confianza, que sea productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Ya está todo preparado, podés arrancar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en orden, podés empezar ya, que tengas un día genial ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés iniciar cuando quieras, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, comenzá con confianza, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés arrancar seguro, que te vaya excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en marcha, ya podés empezar, que sea un día positivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo acomodado, podés iniciar ya, fuerza para hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo perfecto, podés arrancar tranquilo, que tengas un día productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés dar inicio ya, éxitos en la jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo organizado, podés comenzar con calma, que sea un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, ya podés arrancar, mucha fuerza hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en orden, podés iniciar cuando quieras, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, arrancá tranquilo, que tengas un día excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés empezar ya, lo mejor en tu jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo acomodado, podés arrancar seguro, éxitos en la carga ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés iniciar ya, que te vaya genial hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en orden, podés comenzar tranquilo, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, arrancá ya, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo perfecto, podés empezar con confianza, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés iniciar tranquilo, que sea un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés comenzar ya, mucha energía ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en orden, podés arrancar tranquilo, que sea un día excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés iniciar ya, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo acomodado, podés arrancar cuando quieras, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés comenzar con confianza, que sea positivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo perfecto, podés iniciar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés arrancar ya, que sea una buena jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en marcha, podés comenzar cuando quieras, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés dar inicio ya, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés empezar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo acomodado, podés arrancar con calma, que sea productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo en orden, podés iniciar ya, lo mejor para vos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo listo, podés arrancar seguro, que sea una gran jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16",
              "Todo preparado, podés comenzar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://chat.whatsapp.com/IDf7Hu8XlraDglyOkwia16"
            ];

            const mensajeDeRespuesta = obtenerMensajeAlAzar(mensajesDeAcreditacionYPromocion);

            // Preparamos los datos para Kommo USANDO EL FIELD_ID
            const dataToUpdate = {
              custom_fields_values: [
                {
                  field_id: MENSAJEENVIAR_FIELD_ID, // <-- ¡ESTA ES LA CORRECCIÓN CLAVE!
                  values: [{ value: mensajeDeRespuesta }]
                }
              ],
              customFieldMonto
            };

            console.log(`🔄  Actualizando lead ${leadId} con el nuevo mensaje...`);
            console.log("Mensaje seleccionado:", mensajeDeRespuesta);
            console.log("token y kommoId usados:", token, kommoId);
            console.log("dataToUpdate:", JSON.stringify(dataToUpdate, null, 2));
            await axios.patch(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}`, dataToUpdate, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            console.log("✅ Lead actualizado exitosamente en Kommo.");
            return res.status(200).json({ status: "ok", mensaje: "Usuario creado y lead actualizado." });
          } catch (error) {
            // Acceder a los detalles del error de la respuesta HTTP
            const errorResponseData = error.response?.data;
            const errorDetails = errorResponseData || error.message;

            console.error("❌ Error fatal en la ruta /retirar:", errorDetails);

            // ------------------------------------------------------------------
            // 💡 NUEVO CÓDIGO CLAVE: INTENTAR IMPRIMIR EL ARRAY DE VALIDACIÓN
            // ------------------------------------------------------------------
            if (errorResponseData && errorResponseData['validation-errors']) {
              console.error("🛑 DETALLES DE VALIDACIÓN DE KOMMO:");

              // Intentamos imprimir el primer error que Kommo te está devolviendo
              errorResponseData['validation-errors'].forEach((validationError, index) => {
                console.error(`Error de Validación #${index}:`, validationError.errors);
              });
            }
            // ------------------------------------------------------------------

            return res.status(500).json({
              error: "Error interno del servidor.",
              detalles: errorDetails
            });
          }


        } else {
          const errorMessage = cargaData.errorMessage || "La API externa no devolvió un error específico.";
          console.error("❌ Error de la API externa durante retiro:", errorMessage);
          return res.status(400).json({
            error: "Fallo en la carga del usuario.",
            detalles: errorMessage
          });
        }
      } catch (error) {
        const errorDetails = error.response?.data || error.message;
        console.error("❌ Error al realizar la carga en la plataforma externa:", errorDetails);
        return res.status(500).json({
          error: "Error interno del servidor durante el retiro.",
          detalles: errorDetails
        });
      }

    }
  } catch (error) {
    console.error("❌ Error en la ruta /retirar:", error.response?.data || error.message);
    return res.status(500).json({ error: "Error interno del servidor", detalles: error.message });
  }
});

app.post("/saldo", async (req, res) => {
  // 1. OBTENER DATOS INICIALES
  const body = req.body;
  const { kommoId, token } = req.query;
  const leadId = req.body?.leads?.add?.[0]?.id;

  console.log(JSON.stringify(body, null, 2), "← este es lo que devuelve el body");
  console.log(`➡️  Iniciando /saldo para Lead ID: ${leadId}`);


  if (!leadId || !kommoId || !token) {
    console.error("❌ Faltan datos esenciales: leadId, kommoId o token.");
    return res.status(400).json({ error: "Faltan parámetros (leadId, kommoId, token)." });
  }

  let MENSAJEENVIAR_FIELD_ID;
  let api_token;

  if (kommoId === "lafortuna") {
    MENSAJEENVIAR_FIELD_ID = 1902536;
  } else if (kommoId === "neonvip") {
    MENSAJEENVIAR_FIELD_ID = 1407554;
    api_token = "649f298de66e450f91b68832d3701d76a2862c5403d0b71acc072c2b79b87ed9";
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

      console.log("contacto obtenido:", contacto);
      console.log("Propiedades del lead obtenido:", lead);


      const customFieldPlataforma = lead.custom_fields_values?.find(field => field.field_name === 'PLATAFORMA');

      const nombreDelLead = lead.name;
      const plataformaSeleccionada = customFieldPlataforma?.values?.[0]?.value.toLowerCase()

      console.log("👤 Nombre del usuario extraido:", nombreDelLead);
      console.log("🎰 Plataforma seleccionada extraída:", plataformaSeleccionada);

      if (!plataformaSeleccionada || (plataformaSeleccionada !== 'rey santo' && plataformaSeleccionada !== 'fortuna')) {
        console.error("❌ Plataforma seleccionada inválida:", plataformaSeleccionada);
        return res.status(400).json({ error: "Plataforma seleccionada inválida." });
      }

      if (plataformaSeleccionada === 'fortuna') {
        api_token = "c9a837bc0cfe1113a8867b7d105ab0087b59b785c0a2d28ac2717ce520931ce2";
      } else if (plataformaSeleccionada === 'rey santo') {
        api_token = "ec6ab03d2199969f8e3b7a2319a68ce743a30f06eb20422922d454839b619e2b";
      }

      try {
        // 2. REALIZAR LA CARGA EN LA PLATAFORMA EXTERNA

              // 2. REALIZAR LA CARGA EN LA PLATAFORMA EXTERNA
      const formData = new FormData();
      formData.append("api_token", api_token);

        const cargaResponse = await axios.post(`https://admin.reysanto.com/index.php?act=admin&area=users&search=${nombreDelLead}&response=js`, formData);

        const cargaData = cargaResponse.data;

        console.log("datos devueltos:", cargaData);

        if (cargaData.users.length > 0) {

          console.log(`✅ Consulta de saldo realizada exitosamente en ${plataformaSeleccionada} para el usuario ${nombreDelLead}.`);
          

          // Crear el mensaje de confirmación

          try {

            const usuarioInfo = cargaData.users.find(user => user.id === nombreDelLead);
            console.log("Información del usuario extraída:", usuarioInfo);
            if (!usuarioInfo) {
              throw new Error(`No se encontró información del usuario ${nombreDelLead} en la respuesta de la API.`);
            }

            const mensajeDeRespuesta = `Tu saldo retirable es de  $${usuarioInfo.out_balance.ARS} & de Bono no retirable $${usuarioInfo.wager.ARS}.`;

            // Preparamos los datos para Kommo USANDO EL FIELD_ID
            const dataToUpdate = {
              custom_fields_values: [
                {
                  field_id: MENSAJEENVIAR_FIELD_ID, // <-- ¡ESTA ES LA CORRECCIÓN CLAVE!
                  values: [{ value: mensajeDeRespuesta }]
                }
              ],
            };

            console.log(`🔄  Actualizando lead ${leadId} con el nuevo mensaje...`);
            console.log("Mensaje seleccionado:", mensajeDeRespuesta);
            console.log("token y kommoId usados:", token, kommoId);
            console.log("dataToUpdate:", JSON.stringify(dataToUpdate, null, 2));
            await axios.patch(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}`, dataToUpdate, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            console.log("✅ Lead actualizado exitosamente en Kommo.");
            return res.status(200).json({ status: "ok", mensaje: "Usuario creado y lead actualizado." });
          } catch (error) {
            // Acceder a los detalles del error de la respuesta HTTP
            const errorResponseData = error.response?.data;
            const errorDetails = errorResponseData || error.message;

            console.error("❌ Error fatal en la ruta /saldo:", errorDetails);

            // ------------------------------------------------------------------
            // 💡 NUEVO CÓDIGO CLAVE: INTENTAR IMPRIMIR EL ARRAY DE VALIDACIÓN
            // ------------------------------------------------------------------
            if (errorResponseData && errorResponseData['validation-errors']) {
              console.error("🛑 DETALLES DE VALIDACIÓN DE KOMMO:");

              // Intentamos imprimir el primer error que Kommo te está devolviendo
              errorResponseData['validation-errors'].forEach((validationError, index) => {
                console.error(`Error de Validación #${index}:`, validationError.errors);
              });
            }
            // ------------------------------------------------------------------

            return res.status(500).json({
              error: "Error interno del servidor.",
              detalles: errorDetails
            });
          }


        } else {
          const errorMessage = cargaData.errorMessage || "La API externa no devolvió un error específico.";
          console.error("❌ Error de la API externa durante la carga:", errorMessage);
          return res.status(400).json({
            error: "Fallo en la carga del usuario.",
            detalles: errorMessage
          });
        }
      } catch (error) {
        const errorDetails = error.response?.data || error.message;
        console.error("❌ Error al realizar la carga en la plataforma externa:", errorDetails);
        return res.status(500).json({
          error: "Error interno del servidor durante la carga.",
          detalles: errorDetails
        });
      }

    }
  } catch (error) {
    console.error("❌ Error en la ruta /saldo:", error.response?.data || error.message);
    return res.status(500).json({ error: "Error interno del servidor", detalles: error.message });
  }
});

function obtenerMensajeAlAzar(arrayDeMensajes) {
  const indiceAleatorio = Math.floor(Math.random() * arrayDeMensajes.length);
  return arrayDeMensajes[indiceAleatorio];
}

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