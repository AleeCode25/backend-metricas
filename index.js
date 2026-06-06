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
const RegistroRush = require("./models/RegistroRush");
const RegistroLotus = require("./models/RegistroLotus");
const TransferenciaHg = require("./models/TransferenciaHg");
const axios = require('axios');
const cookieParser = require("cookie-parser");
const net = require('net'); // Requerido para validar IP correctamente
const TransferenciaHgGanamos = require("./models/TransferenciaHgGanamos");
const TransferenciaHgLotus = require("./models/TransferenciaHgLotus");
const UsuarioPanel = require("./models/UsuarioPanel");

const app = express();
const PORT = process.env.PORT || 3000;

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

app.post("/guardar", async (req, res) => {
  try {
    let { id, token, pixel, ip, fbclid, mensaje } = req.body;
    const { kommoId } = req.query;

    if (["woncoinbots2", "publicidadkommo", "publicidadgamble", "publicidadlacaja", "publicidadvegas", "christofher06", "matutepinpin"].includes(kommoId) && id) {
      id = id.replace(/\D/g, "");
    }

    // 2. Verificación de campos esenciales
    if (!id || !token || !pixel) {
      return res.status(400).json({ error: "Faltan campos obligatorios (id, token o pixel)" });
    }

    // 3. Validación de IP flexible (Acepta IPv4 e IPv6)
    const ipValida = ip && net.isIP(ip) !== 0;
    const ipFinal = ipValida ? ip : "0.0.0.0"; // No bloquea si la IP falla, usa una genérica

    // 4. Mapeo de Modelos
    const modelos = {
      "opendrust090": RegistroAlan,
      "portodoeste2026": RegistroAlan,
      "dubaisliders": RegistroAlan,
      "fortunarush23": RegistroRush,
      "marygobert2026": RegistroAlanUru,
      "urbanjadeok": RegistroRochy,
      "neonvip": RegistroNeon,
      "kommo202513": RegistroDobleAs,
      "conline": RegistroJoker,
      "azlpublic6": RegistroAzar,
      "woncoinbots2": RegistroCash,
      "publicidadkommo": RegistroCash,
      "publicidadgamble": RegistroCash,
      "publicidadlacaja": RegistroCash,
      "publicidadvegas": RegistroCash,
      "christofher06": RegistroCash,
      "matutepinpin": RegistroCash,
      "pablitoochoa233": RegistroLotus,
    };

    const ModeloSeleccionado = modelos[kommoId];
    if (!ModeloSeleccionado) {
      return res.status(400).json({ error: "ID de Kommo no reconocido" });
    }

    // 5. UPSERT: Si existe lo actualiza, si no, lo crea. 
    // Esto evita el error 409 y la pérdida de datos por reintentos.
    const datosBase = { id, token, pixel, ip: ipFinal, fbclid, mensaje };

    // Añadir leadId vacío si el modelo lo requiere (basado en tu lógica anterior)
    const requiereLeadId = ["opendrust090", "portodoeste2026", "marygobert2026", "urbanjadeok", "woncoinbots2", "publicidadkommo", "publicidadgamble", "publicidadlacaja", "matutepinpin", "publicidadvegas", "azlpublic6"].includes(kommoId);

    if (requiereLeadId) {
      datosBase.leadId = "";
    }

    await ModeloSeleccionado.findOneAndUpdate(
      { id: id },
      datosBase,
      { upsert: true, new: true }
    );

    console.log(`✅ Datos procesados: ID ${id} para ${kommoId}`);
    return res.status(201).json({ mensaje: "Datos procesados correctamente" });

  } catch (err) {
    console.error("❌ Error crítico en /guardar:", err);
    return res.status(500).json({ error: "Error interno" });
  }
});

app.post("/verificacion", async (req, res) => {
  const body = req.body;
  const { kommoId, token, kommoIddoble } = req.query;

  console.log("🐛 DEBUG: kommoId recibido:", kommoId);
  console.log(JSON.stringify(body, null, 2), "← este es lo que devuelve el body");

  const leadId = req.body?.leads?.add?.[0]?.id;

  if (!leadId) {
    return res.status(400).json({ error: "Lead ID no encontrado" });
  }

  const contacto = await obtenerContactoDesdeLead(leadId, kommoId, token);

  if (contacto) {
    const leadResponse = await axios.get(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=custom_fields_values`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const lead = leadResponse.data;

    let campoMensaje = lead.custom_fields_values?.find(field => field.field_name === "mensajeenviar");
    let mensaje = campoMensaje?.values?.[0]?.value;

    console.log("📝 Mensaje guardado en el lead:", mensaje);

    // --- CORRECCIÓN AQUÍ ---
    // Primero extraemos lo que haya entre corchetes [] o el número largo
    let idExtraido = mensaje?.match(/\[(.*?)\]/)?.[1] || mensaje?.match(/\d{13,}/)?.[0];

    // Si es publicidadkommo, limpiamos el ID para que coincida con lo que guardamos
    let idFinalParaBusqueda = idExtraido;
    if (kommoId === "publicidadkommo" && idExtraido) {
      idFinalParaBusqueda = idExtraido.replace(/\D/g, "");
    }

    console.log("🧾 ID original extraído:", idExtraido);
    console.log("🔍 ID final usado para buscar en BD:", idFinalParaBusqueda);

    if (idFinalParaBusqueda) {
      let Modelo;
      if (kommoId === "opendrust090" && kommoIddoble === "kommo202513") {
        Modelo = RegistroDobleAs;
      } else if (["opendrust090", "portodoeste2026", "dubaisliders"].includes(kommoId)) {
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
      } else if (["woncoinbots2", "publicidadkommo", "publicidadgamble", "publicidadlacaja", "publicidadvegas"].includes(kommoId)) {
        Modelo = RegistroCash;
      } else if (kommoId === "azlpublic6") {
        Modelo = RegistroAzar;
      }

      try {
        // Buscamos usando el ID ya limpio
        let registro = await Modelo.findOne({ id: idFinalParaBusqueda });

        if (registro) {
          console.log("✅ Registro encontrado en BD:", registro.id);
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

            if (["opendrust090", "portodoeste2026", "woncoinbots2", "publicidadkommo", "publicidadgamble", "publicidadlacaja", "publicidadvegas", "marygobert2026", "urbanjadeok", "azlpublic6"].includes(kommoId)) {
              console.log("aca entro uno que se le crea el leadId")
              registro.leadId = leadId.toString();
              await registro.save();

              console.log("Registro guardado con nuevo leadId:", registro.leadId);
            }

            if (["opendrust090", "portodoeste2026", "azlpublic6", "publicidadkommo"].includes(kommoId)) {
              return console.log(`${kommoId} es Purchase no se pixelea como LeadCorrectoJoker`);
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

app.post("/lead", async (req, res) => {
  const body = req.body;
  const { kommoId, token, kommoIddoble } = req.query;

  console.log("🐛 DEBUG: kommoId recibido:", kommoId);
  console.log(JSON.stringify(body, null, 2), "← este es lo que devuelve el body");

  const leadId = req.body?.leads?.add?.[0]?.id;

  if (!leadId) {
    return res.status(400).json({ error: "Lead ID no encontrado" });
  }

  const contacto = await obtenerContactoDesdeLead(leadId, kommoId, token);

  if (contacto) {
    const leadResponse = await axios.get(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=custom_fields_values`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const lead = leadResponse.data;

    let campoMensaje = lead.custom_fields_values?.find(field => field.field_name === "mensajeenviar");
    let mensaje = campoMensaje?.values?.[0]?.value;

    console.log("📝 Mensaje guardado en el lead:", mensaje);

    let idExtraido = mensaje?.match(/\[(.*?)\]/)?.[1] || mensaje?.match(/\d{13,}/)?.[0];

    // Si es publicidadkommo, limpiamos el ID para que coincida con lo que guardamos
    let idFinalParaBusqueda = idExtraido;
    if (["woncoinbots2", "publicidadkommo", "publicidadgamble", "publicidadlacaja", "publicidadvegas", "christofher06", "matutepinpin"].includes(kommoId) && idExtraido ) {
      idFinalParaBusqueda = idExtraido.replace(/\D/g, "");
    }

    console.log("🧾 ID original extraído:", idExtraido);
    console.log("🔍 ID final usado para buscar en BD:", idFinalParaBusqueda);

    if (idFinalParaBusqueda) {
      let Modelo;
      if (kommoId === "opendrust090" && kommoIddoble === "kommo202513") {
        Modelo = RegistroDobleAs;
      } else if (["opendrust090", "portodoeste2026", "dubaisliders"].includes(kommoId)) {
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
      } else if (["woncoinbots2", "publicidadkommo", "publicidadgamble", "publicidadlacaja", "publicidadvegas", "christofher06", "matutepinpin"].includes(kommoId)) {
        Modelo = RegistroCash;
      } else if (kommoId === "azlpublic6") {
        Modelo = RegistroAzar;
      } else if (kommoId === "fortunarush23") {
        Modelo = RegistroRush;
      } else if (kommoId === "pablitoochoa233") {
        Modelo = RegistroLotus;
      } else {
        return res.status(400).json({ error: "ID de Kommo no reconocido" });
      }

      try {
        // Buscamos usando el ID ya limpio
        let registro = await Modelo.findOne({ id: idFinalParaBusqueda });

        if (registro) {
          console.log("✅ Registro encontrado en BD:", registro.id);
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

          try {

            if (["opendrust090", "portodoeste2026", "dubaisliders", "pablitoochoa233" , "woncoinbots2", "publicidadkommo", "publicidadgamble", "publicidadlacaja", "publicidadvegas", "matutepinpin", "christofher06" , "marygobert2026", "urbanjadeok", "azlpublic6", "fortunarush23"].includes(kommoId)) {
              console.log("aca entro uno que se le crea el leadId")
              registro.leadId = leadId.toString();
              await registro.save();

              console.log("Registro guardado con nuevo leadId:", registro.leadId);
            }

            const crypto = require("crypto");

            //email hasheado para Facebook, debe ser lowercase y sin espacios antes del hash
            const hashedEmail = registro.email
              ? crypto.createHash("sha256").update(registro.email.trim().toLowerCase()).digest("hex")
              : undefined;

            const event_id = `lead_${leadId}_${Date.now()}`;
            const pixelEndpointUrl = `https://graph.facebook.com/v18.0/${registro.pixel}/events?access_token=${registro.token}`;

            const eventData = {
              event_name: "Lead",
              event_id: event_id,
              event_time: Math.floor(Date.now() / 1000),
              action_source: "website",
              event_source_url: `https://${kommoId}.kommo.com/`,
              user_data: {
                client_ip_address: registro.ip,
                client_user_agent: req.headers["user-agent"],
                fbc: registro.fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${registro.fbclid}` : undefined,
                fbp: registro.fbp || `fb.1.${Math.floor(Date.now() / 1000)}.${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                em: hashedEmail,
              },
            };

            console.log("Datos del evento Clientes Potenciales a enviar:", JSON.stringify(eventData, null, 2));

            const pixelResponse = await axios.post(
              pixelEndpointUrl,
              { data: [eventData] }, // Estructura correcta requerida por FB
              { headers: { "Content-Type": "application/json" } }
            );

            console.log("📡 Pixel Clientes Potenciales ejecutado con éxito:", pixelResponse.data);
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

app.post("/buy", async (req, res) => {
  const body = req.body;
  const { kommoId, token } = req.query;

  console.log("🐛 DEBUG: ENTRO PARA COMPRAR");
  const leadId = req.body?.leads?.add?.[0]?.id;

  if (!leadId) {
    return res.status(400).json({ error: "Lead ID no encontrado" });
  }

  const contacto = await obtenerContactoDesdeLead(leadId, kommoId, token);

  if (contacto) {
    const leadResponse = await axios.get(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=custom_fields_values`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const lead = leadResponse.data;
    let Modelo;

    if (["woncoinbots2", "publicidadkommo", "publicidadgamble", "publicidadlacaja", "publicidadvegas", "christofher06", "matutepinpin"].includes(kommoId)) {
      Modelo = RegistroCash;
    } else if (kommoId === "azlpublic6") {
      Modelo = RegistroAzar;
    } else if (["opendrust090", "portodoeste2026", "dubaisliders"].includes(kommoId)) {
      Modelo = RegistroAlan;
    } else if (kommoId === "fortunarush23") {
      Modelo = RegistroRush;
    } else if (kommoId === "urbanjadeok") {
      Modelo = RegistroRochy;
    } else if (kommoId === "pablitoochoa233") {
      Modelo = RegistroLotus;
    } else {
      return res.status(400).json({ error: "ID de Kommo no reconocido" });
    }

    try {
      let registro = await Modelo.findOne({ leadId: leadId });

      if (registro) {
        try {

          if (registro.isVerified) {
            return console.log("Registro ya pixeleado")
          }

          if (lead.price < 200) {
            return console.log("El valor del lead no cumple con el mínimo para Purchase");
          }

          // --- MEJORA: Normalización de datos para Facebook ---
          const crypto = require("crypto");

          // El email DEBE ser lowercase y sin espacios antes del hash
          const hashedEmail = registro.email
            ? crypto.createHash("sha256").update(registro.email.trim().toLowerCase()).digest("hex")
            : undefined;

          // Aseguramos que el valor sea un número (float)
          const totalValue = parseFloat(lead.price) || 0;

          const event_id = `purchase_${leadId}_${Date.now()}`;
          const pixelEndpointUrl = `https://graph.facebook.com/v18.0/${registro.pixel}/events?access_token=${registro.token}`;

          const eventData = {
            event_name: "Purchase",
            event_id: event_id,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            event_source_url: `https://${kommoId}.kommo.com/`,
            user_data: {
              client_ip_address: registro.ip,
              client_user_agent: req.headers["user-agent"],
              fbc: registro.fbclid ? `fb.1.${Math.floor(Date.now() / 1000)}.${registro.fbclid}` : undefined,
              fbp: registro.fbp || `fb.1.${Math.floor(Date.now() / 1000)}.${Math.floor(1000000000 + Math.random() * 9000000000)}`,
              em: hashedEmail,
            },
            custom_data: {
              currency: "ARS",
              value: totalValue
            },
          };

          console.log("Datos del evento Purchase a enviar:", JSON.stringify(eventData, null, 2));

          const pixelResponse = await axios.post(
            pixelEndpointUrl,
            { data: [eventData] }, // Estructura correcta requerida por FB
            { headers: { "Content-Type": "application/json" } }
          );

          // Actualizar registro como verificado
          registro.isVerified = true;
          registro.verificationStatus = 'verificado';
          await registro.save();

          console.log("📡 Pixel Purchase enviado con éxito:", pixelResponse.data);
          return res.status(200).json({ mensaje: "Purchase enviado", data: pixelResponse.data });

        } catch (error) {
          console.error("❌ Error en Pixel:", error.response?.data || error.message);
          registro.verificationStatus = 'fallido';
          await registro.save();
          return res.status(500).json({ error: "Error al ejecutar pixel", detalle: error.response?.data });
        }
      } else {
        return res.status(404).json({ error: "Registro no encontrado en DB" });
      }
    } catch (error) {
      return res.status(500).json({ error: "Error interno de servidor" });
    }
  }

  return res.status(400).json({ error: "No se pudo obtener el contacto" });
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

    if (["opendrust090", "portodoeste2026", "dubaisliders"].includes(kommoId)) {
      Modelo = RegistroAlan;
    } else if (["woncoinbots2", "publicidadkommo", "publicidadgamble", "publicidadlacaja", "publicidadvegas"].includes(kommoId)) {
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


          if ((lead.price >= 2000 && kommoId === "opendrust090") || (lead.price >= 2000 && kommoId === "portodoeste2026") || (lead.price >= 2000 && kommoId === "woncoinbots2") || (lead.price >= 2000 && kommoId === "publicidadvegas") || (lead.price >= 2000 && kommoId === "publicidadlacaja") || (lead.price >= 2000 && kommoId === "publicidadgamble") || (lead.price >= 2000 && kommoId === "publicidadkommo") || (lead.price >= 2000 && kommoId === "azlpublic6") || (lead.price >= 2000 && kommoId === "urbanjadeok")) {

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
              event_source_url: `https://${kommoId}.kommo.com/`,
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
              event_source_url: `https://${kommoId}.kommo.com/`,
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
              "Todo en orden, ya podés arrancar, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo preparado, podés iniciar cuando quieras, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, empezá con confianza, mucha energía positiva ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo ok, podés arrancar ahora, que te vaya excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo en marcha, podés comenzar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo preparado, podés dar inicio, que tengas una gran jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés empezar ya, lo mejor para vos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo acomodado, arrancá con calma, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés comenzar con confianza, que sea productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Ya está todo preparado, podés arrancar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo en orden, podés empezar ya, que tengas un día genial ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés iniciar cuando quieras, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo preparado, comenzá con confianza, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés arrancar seguro, que te vaya excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo en marcha, ya podés empezar, que sea un día positivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo acomodado, podés iniciar ya, fuerza para hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo perfecto, podés arrancar tranquilo, que tengas un día productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés dar inicio ya, éxitos en la jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo organizado, podés comenzar con calma, que sea un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo preparado, ya podés arrancar, mucha fuerza hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo en orden, podés iniciar cuando quieras, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, arrancá tranquilo, que tengas un día excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo preparado, podés empezar ya, lo mejor en tu jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo acomodado, podés arrancar seguro, éxitos en la carga ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés iniciar ya, que te vaya genial hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo en orden, podés comenzar tranquilo, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo preparado, arrancá ya, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo perfecto, podés empezar con confianza, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés iniciar tranquilo, que sea un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo preparado, podés comenzar ya, mucha energía ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo en orden, podés arrancar tranquilo, que sea un día excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés iniciar ya, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo acomodado, podés arrancar cuando quieras, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo preparado, podés comenzar con confianza, que sea positivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo perfecto, podés iniciar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés arrancar ya, que sea una buena jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo en marcha, podés comenzar cuando quieras, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo preparado, podés dar inicio ya, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés empezar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo acomodado, podés arrancar con calma, que sea productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo en orden, podés iniciar ya, lo mejor para vos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo listo, podés arrancar seguro, que sea una gran jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
              "Todo preparado, podés comenzar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L"
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

app.post('/hg-cash', async (req, res) => { // IMPORTANTE: Agregamos 'async'
  const payload = req.body;

  console.log("Movimiento recibido desde HG Cash:", payload.id);
  console.log ("Detalles del movimiento:", JSON.stringify(payload, null, 2));

  try {
      const {
          id,
          amount,
          direction,
          type,
          coelsaCode,
          fromName,
          fromCUIT,
          date
      } = payload;

      if (direction === 'Inbound' || type === 'inbound') {
          console.log(`⬇️ Procesando Ingreso: $${amount} de ${fromName}`);

          await TransferenciaHg.findOneAndUpdate(
              { transaccionId: id }, // Busca por el ID único de la transferencia
              {
                  transaccionId: id,
                  monto: parseFloat(amount),
                  coelsaCode: coelsaCode,
                  remitente: fromName,
                  cuit: fromCUIT,
                  fechaIngreso: new Date(date)
              },
              { upsert: true, new: true } // Lo crea si no existe
          );

          console.log(`✅ Transferencia de ${fromName} guardada en BD correctamente como PENDIENTE.`);
      } else {
          console.log(`⏭️ Movimiento ignorado (es una salida): ${direction}`);
      }

      res.status(200).send('Webhook recibido y procesado');
      
  } catch (error) {
      console.error("❌ Error guardando el webhook de HG Cash en BD:", error);
      res.status(500).send('Error interno');
  }
});

app.post('/hg-cash-ganamos', async (req, res) => { // IMPORTANTE: Agregamos 'async'
  const payload = req.body;

  console.log("Movimiento recibido desde HG Cash:", payload.id);
  console.log ("Detalles del movimiento:", JSON.stringify(payload, null, 2));

  try {
      const {
          id,
          amount,
          direction,
          type,
          coelsaCode,
          fromName,
          fromCUIT,
          date
      } = payload;

      if (direction === 'Inbound' || type === 'inbound') {
          console.log(`⬇️ Procesando Ingreso: $${amount} de ${fromName}`);

          await TransferenciaHgGanamos.findOneAndUpdate(
              { transaccionId: id }, // Busca por el ID único de la transferencia
              {
                  transaccionId: id,
                  monto: parseFloat(amount),
                  coelsaCode: coelsaCode,
                  remitente: fromName,
                  cuit: fromCUIT,
                  fechaIngreso: new Date(date)
              },
              { upsert: true, new: true } // Lo crea si no existe
          );

          console.log(`✅ Transferencia de ${fromName} guardada en BD correctamente como PENDIENTE.`);
      } else {
          console.log(`⏭️ Movimiento ignorado (es una salida): ${direction}`);
      }

      res.status(200).send('Webhook recibido y procesado');
      
  } catch (error) {
      console.error("❌ Error guardando el webhook de HG Cash en BD:", error);
      res.status(500).send('Error interno');
  }
});

app.post('/hg-cash-lotus', async (req, res) => { // IMPORTANTE: Agregamos 'async'
  const payload = req.body;

  console.log("Movimiento recibido desde HG Cash:", payload.id);
  console.log ("Detalles del movimiento:", JSON.stringify(payload, null, 2));

  try {
      const {
          id,
          amount,
          direction,
          type,
          coelsaCode,
          fromName,
          fromCUIT,
          date
      } = payload;

      if (direction === 'Inbound' || type === 'inbound') {
          console.log(`⬇️ Procesando Ingreso: $${amount} de ${fromName}`);

          await TransferenciaHgLotus.findOneAndUpdate(
              { transaccionId: id }, // Busca por el ID único de la transferencia
              {
                  transaccionId: id,
                  monto: parseFloat(amount),
                  coelsaCode: coelsaCode,
                  remitente: fromName,
                  cuit: fromCUIT,
                  fechaIngreso: new Date(date)
              },
              { upsert: true, new: true } // Lo crea si no existe
          );

          console.log(`✅ Transferencia de ${fromName} guardada en BD correctamente como PENDIENTE.`);
      } else {
          console.log(`⏭️ Movimiento ignorado (es una salida): ${direction}`);
      }

      res.status(200).send('Webhook recibido y procesado');
      
  } catch (error) {
      console.error("❌ Error guardando el webhook de HG Cash en BD:", error);
      res.status(500).send('Error interno');
  }
});

app.post("/match", async (req, res) => {
  try {
    const { kommoId, token } = req.query;
    const leadId = req.body?.leads?.add?.[0]?.id || 
                   req.body?.leads?.update?.[0]?.id || 
                   req.body['leads[add][0][id]'] || 
                   req.body['leads[update][0][id]'];

    console.log(`➡️ Iniciando Webhook de Kommo para Lead ID: ${leadId}`);

    if (!leadId || !kommoId || !token) {
      return res.status(400).json({ error: "Faltan parámetros." });
    }

    // --- IDENTIFICADOR DEL CAMPO MENSAJE SEGÚN EL KOMMO ID ---
    let MENSAJEENVIAR_FIELD_ID;
    if (kommoId === "lafortuna") {
      MENSAJEENVIAR_FIELD_ID = 1902536; // Asegurate de que sea el ID correcto para lafortuna
    } else if (kommoId === "neonvip") {
      MENSAJEENVIAR_FIELD_ID = 1407554;
    } else if (kommoId === "portodoeste2026") {
      MENSAJEENVIAR_FIELD_ID = 1689406; // <-- REEMPLAZA ESTO CON EL ID REAL PARA PORTO OESTE
    } else {
      console.warn(`⚠️ Kommo ID ${kommoId} no reconocido
. No se asignará MENSAJEENVIAR_FIELD_ID, lo que probablemente causará un error al intentar actualizar el lead.`);
    }
    // Si tenés más kommoIds (como opendrust090, portodoeste2026, etc), agregalos acá con su respectivo ID de campo.
    // ---------------------------------------------------------

    const leadResponse = await axios.get(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=custom_fields_values`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const lead = leadResponse.data;
    const monto = Number(lead.price);
    let coelsa = "";
    let cuil = "";

    if (lead.custom_fields_values) {
      const coelsaField = lead.custom_fields_values.find(f => f.field_name === 'COELSA');
      if (coelsaField && coelsaField.values && coelsaField.values.length > 0) coelsa = coelsaField.values[0].value.trim();

      const cuilField = lead.custom_fields_values.find(f => f.field_name === 'CUIL');
      if (cuilField && cuilField.values && cuilField.values.length > 0) cuil = cuilField.values[0].value.trim();
    }
    
    if (!monto || (!cuil && !coelsa)) {
      return res.status(200).json({ message: "Datos incompletos en el lead." }); 
    }

    let cargaPendiente = null;

    // Buscar por CUIL
    if (cuil) {
      cargaPendiente = await TransferenciaHg.findOne({
        estado: "PENDIENTE",
        monto: monto,
        cuit: { $regex: new RegExp(`^${cuil}$`, 'i') }
      });
    }

    // Buscar por COELSA
    if (!cargaPendiente && coelsa) {
      cargaPendiente = await TransferenciaHg.findOne({
        estado: "PENDIENTE",
        monto: monto,
        coelsaCode: { $regex: new RegExp(`^${coelsa}$`, 'i') } 
      });
    }

    // 4. RESOLUCIÓN DE LA BÚSQUEDA Y LLAMADA A NEXT.JS
    if (cargaPendiente) {
      console.log(`✅ ¡MATCH ENCONTRADO! ID: ${cargaPendiente._id}. Iniciando llamada al panel Next.js...`);
      
      const safeUsername = lead.name ? lead.name.trim() : null;

      if (!safeUsername) {
        console.error("❌ La transferencia no tiene un 'usuarioCasino' guardado para hacer la autocarga.");
        return res.status(200).json({ message: "Match encontrado, pero falta el usuario de casino." });
      }

      try {
        // Le pegamos al endpoint de Next.js pasándole la clave secreta
        const panelResponse = await axios.post(`https://paneldecargas.site/api/transferencias/${cargaPendiente._id}/cargar`, {
          usuarioCasino: safeUsername,
          apiSecret: "ReySanto2026_AutoCargaSegura" // <-- DEBE SER EXACTAMENTE LA MISMA CLAVE
        });

        console.log(`✅ Autocarga exitosa mediante el panel Next.js.`);
        
        // --- INICIO DE ACTUALIZACIÓN EN KOMMO ---
        if (MENSAJEENVIAR_FIELD_ID) {
          const mensajesDeAcreditacionYPromocion = [
            "Todo en orden, ya podés arrancar, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo preparado, podés iniciar cuando quieras, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, empezá con confianza, mucha energía positiva ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo ok, podés arrancar ahora, que te vaya excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo en marcha, podés comenzar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo preparado, podés dar inicio, que tengas una gran jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés empezar ya, lo mejor para vos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo acomodado, arrancá con calma, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés comenzar con confianza, que sea productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Ya está todo preparado, podés arrancar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo en orden, podés empezar ya, que tengas un día genial ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés iniciar cuando quieras, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo preparado, comenzá con confianza, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés arrancar seguro, que te vaya excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo en marcha, ya podés empezar, que sea un día positivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo acomodado, podés iniciar ya, fuerza para hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo perfecto, podés arrancar tranquilo, que tengas un día productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés dar inicio ya, éxitos en la jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo organizado, podés comenzar con calma, que sea un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo preparado, ya podés arrancar, mucha fuerza hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo en orden, podés iniciar cuando quieras, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, arrancá tranquilo, que tengas un día excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo preparado, podés empezar ya, lo mejor en tu jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo acomodado, podés arrancar seguro, éxitos en la carga ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés iniciar ya, que te vaya genial hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo en orden, podés comenzar tranquilo, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo preparado, arrancá ya, que tengas un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo perfecto, podés empezar con confianza, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés iniciar tranquilo, que sea un gran día ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo preparado, podés comenzar ya, mucha energía ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo en orden, podés arrancar tranquilo, que sea un día excelente ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés iniciar ya, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo acomodado, podés arrancar cuando quieras, éxitos ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo preparado, podés comenzar con confianza, que sea positivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo perfecto, podés iniciar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés arrancar ya, que sea una buena jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo en marcha, podés comenzar cuando quieras, te deseo lo mejor ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo preparado, podés dar inicio ya, mucha fuerza ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés empezar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo acomodado, podés arrancar con calma, que sea productivo ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo en orden, podés iniciar ya, lo mejor para vos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo listo, podés arrancar seguro, que sea una gran jornada ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L",
            "Todo preparado, podés comenzar tranquilo, éxitos hoy ❤ Sumate a nuestro grupo VIP y viví experiencias únicas, con beneficios especiales y muchas sorpresas https://whatsapp.com/channel/0029Vb7m1EJ5PO0sI9JrLd3L"
          ];

          const mensajeDeRespuesta = obtenerMensajeAlAzar(mensajesDeAcreditacionYPromocion);

          const dataToUpdate = {
            custom_fields_values: [
              {
                field_id: MENSAJEENVIAR_FIELD_ID,
                values: [{ value: mensajeDeRespuesta }]
              }
            ]
          };

          console.log(`🔄 Actualizando lead ${leadId} con el nuevo mensaje...`);
          await axios.patch(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}`, dataToUpdate, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log("✅ Lead actualizado exitosamente en Kommo.");
        } else {
          console.log("⚠️ No se actualizó Kommo porque no hay MENSAJEENVIAR_FIELD_ID configurado para este kommoId.");
        }
        // --- FIN DE ACTUALIZACIÓN EN KOMMO ---

        return res.status(200).json({ 
          success: true, 
          message: "Match exitoso, saldo cargado automáticamente y mensaje enviado.",
          idTransferencia: cargaPendiente._id 
        });

      } catch (nextError) {
        // Si Next.js o Zeus rebotan la carga
        const errorDetail = nextError.response?.data || nextError.message;
        console.error(`❌ El panel de Next.js rechazó la autocarga:`, errorDetail);
        
        return res.status(200).json({ 
          success: false, 
          message: "Match encontrado, pero falló la carga en el panel.",
          detalles: errorDetail
        });
      }

    } else {
      console.log("❌ No se encontró coincidencia en pendientes.");
      return res.status(200).json({ success: false, message: "No se encontró coincidencia en pendientes." });
    }

  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error("🔥 Error crítico en el Webhook:", errorMsg);
    return res.status(500).json({ error: "Error interno", detalles: errorMsg });
  }
});

app.post("/matchg", async (req, res) => {
  try {
    const { kommoId, token } = req.query;
    const leadId = req.body?.leads?.add?.[0]?.id || 
                   req.body?.leads?.update?.[0]?.id || 
                   req.body['leads[add][0][id]'] || 
                   req.body['leads[update][0][id]'];

    console.log(`➡️ Iniciando Webhook de Kommo para Lead ID: ${leadId}`);

    if (!leadId || !kommoId || !token) {
      return res.status(400).json({ error: "Faltan parámetros." });
    }

    // --- IDENTIFICADOR DEL CAMPO MENSAJE SEGÚN EL KOMMO ID ---
    let MENSAJEENVIAR_FIELD_ID;
    if (kommoId === "lafortuna") {
      MENSAJEENVIAR_FIELD_ID = 1902536; // Asegurate de que sea el ID correcto para lafortuna
    } else if (kommoId === "neonvip") {
      MENSAJEENVIAR_FIELD_ID = 1407554;
    } else if (kommoId === "dubaisliders") {
      MENSAJEENVIAR_FIELD_ID = 508056; 
    } else {
      console.warn(`⚠️ Kommo ID ${kommoId} no reconocido
. No se asignará MENSAJEENVIAR_FIELD_ID, lo que probablemente causará un error al intentar actualizar el lead.`);
    }
    // Si tenés más kommoIds (como opendrust090, portodoeste2026, etc), agregalos acá con su respectivo ID de campo.
    // ---------------------------------------------------------

    const leadResponse = await axios.get(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=custom_fields_values`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const lead = leadResponse.data;
    const monto = Number(lead.price);
    let coelsa = "";
    let cuil = "";

    if (lead.custom_fields_values) {
      const coelsaField = lead.custom_fields_values.find(f => f.field_name === 'COELSA');
      if (coelsaField && coelsaField.values && coelsaField.values.length > 0) coelsa = coelsaField.values[0].value.trim();

      const cuilField = lead.custom_fields_values.find(f => f.field_name === 'CUIL');
      if (cuilField && cuilField.values && cuilField.values.length > 0) cuil = cuilField.values[0].value.trim();
    }
    
    if (!monto || (!cuil && !coelsa)) {
      return res.status(200).json({ message: "Datos incompletos en el lead." }); 
    }

    let cargaPendiente = null;

    // Buscar por CUIL
    if (cuil) {
      cargaPendiente = await TransferenciaHgGanamos.findOne({
        estado: "PENDIENTE",
        monto: monto,
        cuit: { $regex: new RegExp(`^${cuil}$`, 'i') }
      });
    }

    // Buscar por COELSA
    if (!cargaPendiente && coelsa) {
      cargaPendiente = await TransferenciaHgGanamos.findOne({
        estado: "PENDIENTE",
        monto: monto,
        coelsaCode: { $regex: new RegExp(`^${coelsa}$`, 'i') } 
      });
    }

    // 4. RESOLUCIÓN DE LA BÚSQUEDA Y LLAMADA A NEXT.JS
    if (cargaPendiente) {
      console.log(`✅ ¡MATCH ENCONTRADO! ID: ${cargaPendiente._id}. Iniciando llamada al panel Next.js...`);
      
      const safeUsername = lead.name ? lead.name.trim() : null;

      if (!safeUsername) {
        console.error("❌ La transferencia no tiene un 'usuarioCasino' guardado para hacer la autocarga.");
        return res.status(200).json({ message: "Match encontrado, pero falta el usuario de casino." });
      }

      try {
        // Le pegamos al endpoint de Next.js pasándole la clave secreta
        const panelResponse = await axios.post(`https://panelanubis.site/api/transferencias/${cargaPendiente._id}/cargar`, {
          usuarioCasino: safeUsername,
          apiSecret: "ReySanto2026_AutoCargaSegura" // <-- DEBE SER EXACTAMENTE LA MISMA CLAVE
        });

        console.log(`✅ Autocarga exitosa mediante el panel Next.js.`);
        
        // --- INICIO DE ACTUALIZACIÓN EN KOMMO ---
        if (MENSAJEENVIAR_FIELD_ID) {
          const mensajesDeAcreditacionYPromocion = [
            "Todo listo, ya podés iniciar ❤️. Recordá que en nuestra página tenés chat directo con nosotros las 24 hs, todos los días del año. Si algún número no responde, escribinos por ahí: https://ganamosnet.win",
            "Ya está todo preparado para que comiences 💖. Ante cualquier consulta, contamos con atención 24/7 desde nuestra página web: https://ganamosnet.win",
            "Perfecto, ya podés ingresar 🫶. Si tenés problemas para comunicarte por WhatsApp, encontranos en el chat de nuestra web: https://ganamosnet.win",
            "Todo en orden 💕. Recordá que nuestra página cuenta con atención directa las 24 horas para ayudarte cuando lo necesites: https://ganamosnet.win",
            "Ya quedó listo ❤️. Si alguna línea demora en responder, podés contactarnos desde el chat disponible en nuestra web: https://ganamosnet.win",
            "Excelente 💖. Ya podés comenzar. Además, tenés soporte directo las 24 hs desde nuestra página: https://ganamosnet.win",
            "Todo preparado para vos 🫶. Si no obtenés respuesta por algún número, escribinos desde nuestro sitio web: https://ganamosnet.win",
            "Ya está disponible 💕. Recordá que contamos con atención permanente a través del chat de nuestra página: https://ganamosnet.win",
            "Todo correcto ❤️. Ya podés continuar. Ante cualquier inconveniente, nuestro chat web está activo las 24 hs: https://ganamosnet.win",
            "Listo 💖. Ya podés acceder. Si algún contacto no responde, encontranos directamente en nuestra web: https://ganamosnet.win",
            "Ya quedó todo solucionado 🫶. También podés comunicarte con nosotros desde el chat online disponible todo el día: https://ganamosnet.win",
            "Perfecto, ya está habilitado 💕. Nuestro equipo también atiende las 24 hs mediante la página: https://ganamosnet.win",
            "Todo listo por acá ❤️. Si necesitás ayuda, el chat de nuestra web está disponible en cualquier momento: https://ganamosnet.win",
            "Ya podés continuar sin problemas 💖. Recordá que contamos con atención online las 24 horas: https://ganamosnet.win",
            "Excelente, ya está realizado 🫶. Si una línea está ocupada, escribinos desde la página: https://ganamosnet.win",
            "Todo en condiciones para que comiences 💕. Además, tenés soporte permanente desde nuestro sitio: https://ganamosnet.win",
            "Ya quedó resuelto ❤️. Si no lográs comunicarte por WhatsApp, encontranos en el chat web: https://ganamosnet.win",
            "Listo, ya podés ingresar 💖. Nuestro canal de atención web permanece activo las 24 hs: https://ganamosnet.win",
            "Todo preparado 🫶. Ante cualquier consulta, podés escribirnos directamente desde la página: https://ganamosnet.win",
            "Ya está todo correcto 💕. Si algún número presenta demoras, utilizá nuestro chat online: https://ganamosnet.win",
            "Perfecto, ya podés avanzar ❤️. Recordá que siempre estamos disponibles desde la web: https://ganamosnet.win",
            "Todo listo para comenzar 💖. Si necesitás asistencia, escribinos desde el chat de la página: https://ganamosnet.win",
            "Ya quedó gestionado 🫶. También podés encontrarnos las 24 hs en nuestro sitio web: https://ganamosnet.win",
            "Excelente, ya está disponible 💕. Ante cualquier inconveniente, tenés atención directa desde la página: https://ganamosnet.win",
            "Todo realizado ❤️. Si una línea no recibe mensajes, podés comunicarte con nosotros desde la web: https://ganamosnet.win",
            "Ya está preparado 💖. Nuestro chat online funciona las 24 horas, todos los días del año: https://ganamosnet.win",
            "Todo listo, ya podés seguir 🫶. Si algún contacto demora en responder, escribinos por la página: https://ganamosnet.win",
            "Ya quedó activo 💕. Recordá que contamos con soporte permanente desde nuestro sitio web: https://ganamosnet.win",
            "Perfecto, ya podés iniciar ❤️. Si necesitás ayuda, estamos disponibles las 24 hs mediante la página: https://ganamosnet.win",
            "Todo en orden 💖. Cualquier consulta o demora en alguna línea, escribinos directamente desde nuestra web: https://ganamosnet.win"
          ];

          const mensajeDeRespuesta = obtenerMensajeAlAzar(mensajesDeAcreditacionYPromocion);

          const dataToUpdate = {
            custom_fields_values: [
              {
                field_id: MENSAJEENVIAR_FIELD_ID,
                values: [{ value: mensajeDeRespuesta }]
              }
            ]
          };

          console.log(`🔄 Actualizando lead ${leadId} con el nuevo mensaje...`);
          await axios.patch(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}`, dataToUpdate, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log("✅ Lead actualizado exitosamente en Kommo.");
        } else {
          console.log("⚠️ No se actualizó Kommo porque no hay MENSAJEENVIAR_FIELD_ID configurado para este kommoId.");
        }
        // --- FIN DE ACTUALIZACIÓN EN KOMMO ---

        return res.status(200).json({ 
          success: true, 
          message: "Match exitoso, saldo cargado automáticamente y mensaje enviado.",
          idTransferencia: cargaPendiente._id 
        });

      } catch (nextError) {
        // Si Next.js o Zeus rebotan la carga
        const errorDetail = nextError.response?.data || nextError.message;
        console.error(`❌ El panel de Next.js rechazó la autocarga:`, errorDetail);
        
        return res.status(200).json({ 
          success: false, 
          message: "Match encontrado, pero falló la carga en el panel.",
          detalles: errorDetail
        });
      }

    } else {
      console.log("❌ No se encontró coincidencia en pendientes.");
      return res.status(200).json({ success: false, message: "No se encontró coincidencia en pendientes." });
    }

  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error("🔥 Error crítico en el Webhook:", errorMsg);
    return res.status(500).json({ error: "Error interno", detalles: errorMsg });
  }
});

app.post("/matchl", async (req, res) => {
  try {
    const { kommoId, token } = req.query;
    const leadId = req.body?.leads?.add?.[0]?.id || 
                   req.body?.leads?.update?.[0]?.id || 
                   req.body['leads[add][0][id]'] || 
                   req.body['leads[update][0][id]'];

    console.log(`➡️ Iniciando Webhook de Kommo para Lead ID: ${leadId}`);

    if (!leadId || !kommoId || !token) {
      return res.status(400).json({ error: "Faltan parámetros." });
    }

    // --- IDENTIFICADOR DEL CAMPO MENSAJE SEGÚN EL KOMMO ID ---
    let MENSAJEENVIAR_FIELD_ID;
    if (kommoId === "pablitoochoa233") {
      MENSAJEENVIAR_FIELD_ID = 181660; // Asegurate de que sea el ID correcto para lafortuna
    } else {
      console.warn(`⚠️ Kommo ID ${kommoId} no reconocido
. No se asignará MENSAJEENVIAR_FIELD_ID, lo que probablemente causará un error al intentar actualizar el lead.`);
    }
    // Si tenés más kommoIds (como opendrust090, portodoeste2026, etc), agregalos acá con su respectivo ID de campo.
    // ---------------------------------------------------------

    const leadResponse = await axios.get(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}?with=custom_fields_values`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const lead = leadResponse.data;
    const monto = Number(lead.price);
    let coelsa = "";
    let cuil = "";

    if (lead.custom_fields_values) {
      const coelsaField = lead.custom_fields_values.find(f => f.field_name === 'COELSA');
      if (coelsaField && coelsaField.values && coelsaField.values.length > 0) coelsa = coelsaField.values[0].value.trim();

      const cuilField = lead.custom_fields_values.find(f => f.field_name === 'CUIL');
      if (cuilField && cuilField.values && cuilField.values.length > 0) cuil = cuilField.values[0].value.trim();
    }
    
    if (!monto || (!cuil && !coelsa)) {
      return res.status(200).json({ message: "Datos incompletos en el lead." }); 
    }

    let cargaPendiente = null;

    // Buscar por CUIL
    if (cuil) {
      cargaPendiente = await TransferenciaHgLotus.findOne({
        estado: "PENDIENTE",
        monto: monto,
        cuit: { $regex: new RegExp(`^${cuil}$`, 'i') }
      });
    }

    // Buscar por COELSA
    if (!cargaPendiente && coelsa) {
      cargaPendiente = await TransferenciaHgLotus.findOne({
        estado: "PENDIENTE",
        monto: monto,
        coelsaCode: { $regex: new RegExp(`^${coelsa}$`, 'i') } 
      });
    }

    // 4. RESOLUCIÓN DE LA BÚSQUEDA Y LLAMADA A NEXT.JS
    if (cargaPendiente) {
      console.log(`✅ ¡MATCH ENCONTRADO! ID: ${cargaPendiente._id}. Iniciando llamada al panel Next.js...`);
      
      const safeUsername = lead.name ? lead.name.trim() : null;

      if (!safeUsername) {
        console.error("❌ La transferencia no tiene un 'usuarioCasino' guardado para hacer la autocarga.");
        return res.status(200).json({ message: "Match encontrado, pero falta el usuario de casino." });
      }

      try {
        // Le pegamos al endpoint de Next.js pasándole la clave secreta
        const panelResponse = await axios.post(`https://panellotus.site/api/transferencias/${cargaPendiente._id}/cargar`, {
          usuarioCasino: safeUsername,
          apiSecret: "ReySanto2026_AutoCargaSegura" // <-- DEBE SER EXACTAMENTE LA MISMA CLAVE
        });

        console.log(`✅ Autocarga exitosa mediante el panel Next.js.`);
        
        // --- INICIO DE ACTUALIZACIÓN EN KOMMO ---
        if (MENSAJEENVIAR_FIELD_ID) {
          const mensajesDeAcreditacionYPromocion = [
            "Todo listo, ya podés iniciar ❤️. Recordá que en nuestra página tenés chat directo con nosotros las 24 hs, todos los días del año. Si algún número no responde, escribinos por ahí: https://ganamosnet.win",
            "Ya está todo preparado para que comiences 💖. Ante cualquier consulta, contamos con atención 24/7 desde nuestra página web: https://ganamosnet.link",
            "Perfecto, ya podés ingresar 🫶. Si tenés problemas para comunicarte por WhatsApp, encontranos en el chat de nuestra web: https://ganamosnet.link",
            "Todo en orden 💕. Recordá que nuestra página cuenta con atención directa las 24 horas para ayudarte cuando lo necesites: https://ganamosnet.link",
            "Ya quedó listo ❤️. Si alguna línea demora en responder, podés contactarnos desde el chat disponible en nuestra web: https://ganamosnet.link",
            "Excelente 💖. Ya podés comenzar. Además, tenés soporte directo las 24 hs desde nuestra página: https://ganamosnet.link",
            "Todo preparado para vos 🫶. Si no obtenés respuesta por algún número, escribinos desde nuestro sitio web: https://ganamosnet.link",
            "Ya está disponible 💕. Recordá que contamos con atención permanente a través del chat de nuestra página: https://ganamosnet.link",
            "Todo correcto ❤️. Ya podés continuar. Ante cualquier inconveniente, nuestro chat web está activo las 24 hs: https://ganamosnet.link",
            "Listo 💖. Ya podés acceder. Si algún contacto no responde, encontranos directamente en nuestra web: https://ganamosnet.link",
            "Ya quedó todo solucionado 🫶. También podés comunicarte con nosotros desde el chat online disponible todo el día: https://ganamosnet.link",
            "Perfecto, ya está habilitado 💕. Nuestro equipo también atiende las 24 hs mediante la página: https://ganamosnet.link",
            "Todo listo por acá ❤️. Si necesitás ayuda, el chat de nuestra web está disponible en cualquier momento: https://ganamosnet.link",
            "Ya podés continuar sin problemas 💖. Recordá que contamos con atención online las 24 horas: https://ganamosnet.link",
            "Excelente, ya está realizado 🫶. Si una línea está ocupada, escribinos desde la página: https://ganamosnet.link",
            "Todo en condiciones para que comiences 💕. Además, tenés soporte permanente desde nuestro sitio: https://ganamosnet.link",
            "Ya quedó resuelto ❤️. Si no lográs comunicarte por WhatsApp, encontranos en el chat web: https://ganamosnet.link",
            "Listo, ya podés ingresar 💖. Nuestro canal de atención web permanece activo las 24 hs: https://ganamosnet.link",
            "Todo preparado 🫶. Ante cualquier consulta, podés escribirnos directamente desde la página: https://ganamosnet.link",
            "Ya está todo correcto 💕. Si algún número presenta demoras, utilizá nuestro chat online: https://ganamosnet.link",
            "Perfecto, ya podés avanzar ❤️. Recordá que siempre estamos disponibles desde la web: https://ganamosnet.link",
            "Todo listo para comenzar 💖. Si necesitás asistencia, escribinos desde el chat de la página: https://ganamosnet.link",
            "Ya quedó gestionado 🫶. También podés encontrarnos las 24 hs en nuestro sitio web: https://ganamosnet.link",
            "Excelente, ya está disponible 💕. Ante cualquier inconveniente, tenés atención directa desde la página: https://ganamosnet.link",
            "Todo realizado ❤️. Si una línea no recibe mensajes, podés comunicarte con nosotros desde la web: https://ganamosnet.link",
            "Ya está preparado 💖. Nuestro chat online funciona las 24 horas, todos los días del año: https://ganamosnet.link",
            "Todo listo, ya podés seguir 🫶. Si algún contacto demora en responder, escribinos por la página: https://ganamosnet.link",
            "Ya quedó activo 💕. Recordá que contamos con soporte permanente desde nuestro sitio web: https://ganamosnet.link",
            "Perfecto, ya podés iniciar ❤️. Si necesitás ayuda, estamos disponibles las 24 hs mediante la página: https://ganamosnet.link",
            "Todo en orden 💖. Cualquier consulta o demora en alguna línea, escribinos directamente desde nuestra web: https://ganamosnet.link"
          ];

          const mensajeDeRespuesta = obtenerMensajeAlAzar(mensajesDeAcreditacionYPromocion);

          const dataToUpdate = {
            custom_fields_values: [
              {
                field_id: MENSAJEENVIAR_FIELD_ID,
                values: [{ value: mensajeDeRespuesta }]
              }
            ]
          };

          console.log(`🔄 Actualizando lead ${leadId} con el nuevo mensaje...`);
          await axios.patch(`https://${kommoId}.kommo.com/api/v4/leads/${leadId}`, dataToUpdate, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log("✅ Lead actualizado exitosamente en Kommo.");
        } else {
          console.log("⚠️ No se actualizó Kommo porque no hay MENSAJEENVIAR_FIELD_ID configurado para este kommoId.");
        }
        // --- FIN DE ACTUALIZACIÓN EN KOMMO ---

        return res.status(200).json({ 
          success: true, 
          message: "Match exitoso, saldo cargado automáticamente y mensaje enviado.",
          idTransferencia: cargaPendiente._id 
        });

      } catch (nextError) {
        // Si Next.js o Zeus rebotan la carga
        const errorDetail = nextError.response?.data || nextError.message;
        console.error(`❌ El panel de Next.js rechazó la autocarga:`, errorDetail);
        
        return res.status(200).json({ 
          success: false, 
          message: "Match encontrado, pero falló la carga en el panel.",
          detalles: errorDetail
        });
      }

    } else {
      console.log("❌ No se encontró coincidencia en pendientes.");
      return res.status(200).json({ success: false, message: "No se encontró coincidencia en pendientes." });
    }

  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error("🔥 Error crítico en el Webhook:", errorMsg);
    return res.status(500).json({ error: "Error interno", detalles: errorMsg });
  }
});

// 📞 ENDPOINT PARA LA LANDING: Consumir números por cliente
app.get("/api/numeros", async (req, res) => {
  try {
    const { cliente } = req.query;

    if (!cliente) {
      return res.status(400).json({ error: "Falta el parámetro cliente" });
    }

    // Buscamos al usuario en la colección usuariosPanel (en minúsculas por consistencia)
    const usuarioEncontrado = await UsuarioPanel.findOne({ usuario: cliente.toLowerCase() });

    if (!usuarioEncontrado) {
      return res.status(404).json({ error: "Cliente no encontrado en el panel" });
    }

    // Devolvemos la estructura exacta que espera la landing
    return res.status(200).json({
      cliente: usuarioEncontrado.usuario,
      numeros: usuarioEncontrado.numeros
    });

  } catch (err) {
    console.error("❌ Error en GET /api/numeros:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// 🖥️ ENDPOINT PARA EL PANEL: Crear o editar usuarios y sus números (Upsert)
app.post("/api/panel/guardar-cliente", async (req, res) => {
  try {
    const { usuario, contrasena, numeros } = req.body;

    if (!usuario || !contrasena || !Array.isArray(numeros)) {
      return res.status(400).json({ error: "Campos inválidos. 'numeros' debe ser un array." });
    }

    const usuarioQuery = usuario.toLowerCase().trim();

    // Buscamos y actualizamos, si no existe lo crea (upsert)
    const usuarioActualizado = await UsuarioPanel.findOneAndUpdate(
      { usuario: usuarioQuery },
      { 
        usuario: usuarioQuery,
        contrasena, // Nota: Más adelante podrías aplicarle bcrypt para encriptarla si lo requiere tu seguridad
        numeros 
      },
      { upsert: true, new: true }
    );

    console.log(`💾 Cliente guardado/actualizado en Panel: ${usuarioQuery}`);
    return res.status(200).json({ 
      mensaje: "Usuario de panel guardado correctamente", 
      data: usuarioActualizado 
    });

  } catch (err) {
    console.error("❌ Error en /api/panel/guardar-cliente:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

app.post('/api/login', async (req, res) => {
  try {
      const { usuario, password } = req.body; // PHP manda esto

      if (!usuario || !password) {
          return res.status(400).json({ 
              success: false, 
              message: "Por favor, completá todos los campos." 
          });
      }

      // Buscamos en la colección 'usuariosPanel' pasando a minúsculas
      const user = await UsuarioPanel.findOne({ usuario: usuario.trim().toLowerCase() });
      if (!user) {
          return res.status(401).json({ 
              success: false, 
              message: "Usuario o contraseña incorrectos." 
          });
      }

      // 🔥 COMPARACIÓN DIRECTA: Como guardás en texto plano, comparamos directo
      if (password !== user.contrasena) {
          return res.status(401).json({ 
              success: false, 
              message: "Usuario o contraseña incorrectos." 
          });
      }

      // Si coincide, mandamos éxito a PHP
      return res.status(200).json({
          success: true,
          usuario: user.usuario
      });

  } catch (error) {
      console.error("Error en el login:", error);
      return res.status(500).json({ 
          success: false, 
          message: "Error interno del servidor." 
      });
  }
});

app.post("/api/numeros/agregar", async (req, res) => {
  try {
    const { usuario, numero } = req.body;

    if (!usuario || !numero) {
      return res.status(400).json({ success: false, error: "Faltan campos requeridos." });
    }

    const usuarioQuery = usuario.toLowerCase().trim();

    // $addToSet es clave porque evita que se agregue el mismo número duplicado si clickean dos veces
    await UsuarioPanel.updateOne(
      { usuario: usuarioQuery },
      { $addToSet: { numeros: numero.trim() } }
    );

    console.log(`📱 Número +${numero} agregado a la rotación de: ${usuarioQuery}`);
    return res.status(200).json({ success: true, mensaje: "Número agregado con éxito." });

  } catch (err) {
    console.error("❌ Error en /api/numeros/agregar:", err);
    return res.status(500).json({ success: false, error: "Error interno del servidor." });
  }
});

// 📤 ENDPOINT: ELIMINAR NÚMERO DEL ARRAY
app.post("/api/numeros/eliminar", async (req, res) => {
  try {
    const { usuario, numero } = req.body;

    if (!usuario || !numero) {
      return res.status(400).json({ success: false, error: "Faltan campos requeridos." });
    }

    const usuarioQuery = usuario.toLowerCase().trim();

    // $pull remueve el string exacto del número de adentro del array
    await UsuarioPanel.updateOne(
      { usuario: usuarioQuery },
      { $pull: { numeros: numero.trim() } }
    );

    console.log(`🗑️ Número +${numero} eliminado de la rotación de: ${usuarioQuery}`);
    return res.status(200).json({ success: true, mensaje: "Número eliminado con éxito." });

  } catch (err) {
    console.error("❌ Error en /api/numeros/eliminar:", err);
    return res.status(500).json({ success: false, error: "Error interno del servidor." });
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});