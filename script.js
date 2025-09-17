

//CARGAR CONFIGURACIÓN DESDE JSON 
const id_emp = document.getElementById('nomEmp').value;
const urlConfig = `http://localhost/Chatbot-AdminCenter/getConfig.php?id_emp=${id_emp}`;
let windowConfig = {};
let chatbotMinimizado = false;
let flujoConversacion = "";
let estadoConversacion = "";
let temaEnCurso = false;
let csvDataPorColumna = {};

//FUNCIONES DE ESTILOS
function aplicarEstilosBotones(contenedor) {
    if (!windowConfig.estilos) return;
    const botones = contenedor.querySelectorAll("button");
    botones.forEach(boton => {
        // Estilo base
        boton.style.backgroundColor = windowConfig.estilos.colorSecundario;
        boton.style.color = windowConfig.estilos.colorTexto;
        boton.style.borderColor = windowConfig.estilos.colorAcento || windowConfig.estilos.colorPrimario;
        boton.style.transition = "background-color 0.3s ease, transform 0.1s ease";

        // Hover
        boton.addEventListener("mouseenter", () => {
            boton.style.backgroundColor = windowConfig.estilos.colorAcento;
        });
        boton.addEventListener("mouseleave", () => {
            boton.style.backgroundColor = windowConfig.estilos.colorSecundario;
        });

        // Click (efecto visual)
        boton.addEventListener("mousedown", () => {
            boton.style.backgroundColor = windowConfig.estilos.colorAcento;
            boton.style.transform = "scale(0.95)";
        });
        boton.addEventListener("mouseup", () => {
            boton.style.backgroundColor = windowConfig.estilos.colorSecundario;
            boton.style.transform = "scale(1)";
        });
    });
}


// -------------------- VALIDACIÓN DE URL --------------------
function validarURLChatbot(urlJSON) {
    if (!urlJSON) return true; // Si no hay URL configurada, permitir por defecto

    const normalizar = (url) => url.replace(/\/+$/, "").toLowerCase();

    const urlActual = normalizar(window.location.href);
    const urlConfigurada = normalizar(urlJSON);

    return urlActual === urlConfigurada;
}

async function cargarConfigChatbot() {
    try {
        const response = await fetch(urlConfig);
        if (!response.ok) throw new Error("No se pudo cargar el JSON");

        const config = await response.json();

        const urlJSON = config.funcionamiento?.urlChatbot || "";
        if (!validarURLChatbot(urlJSON)) {
            mostrarModalURL("La URL configurada para el chatbot no coincide con esta página. No se puede cargar.");
            return;
        }

        windowConfig = config;

        // CONFIGURACIÓN VISUAL Y DINÁMICA 
        const chatbotContainer = document.getElementById("chatbot-container");
        if (chatbotContainer) {
            const header = chatbotContainer.querySelector(".chatbot-header");
            if (header) {
                header.style.backgroundColor = config.estilos.colorPrimario;
                header.style.color = config.estilos.colorTexto;

                const logo = header.querySelector(".chatbot-icon");
                if (logo) logo.src = config.estilos.logo;

                const nombreElemento = header.querySelector(".chatbot-nombre");
                if (nombreElemento) nombreElemento.textContent = config.estilos.nombreChatbot;

                 if(config.estilos.colorTexto){
                aplicarColorBotonesSVG(config.estilos.colorTexto);
                }
            }

            const mensajeInicial = document.getElementById("mensaje-inicial");
            if (mensajeInicial) {
                mensajeInicial.querySelector("p").textContent = config.estilos.saludo;

                const botonesContainer = mensajeInicial.querySelector(".chatbot-button-container");
                botonesContainer.innerHTML = "";

                // Crear botones dinámicos desde JSON
                config.conversacion.forEach((conver) => {
                    const btn = document.createElement("button");
                    btn.textContent = conver.tema;
                    btn.onclick = () => manejarTema(conver);
                    botonesContainer.appendChild(btn);
                });

                aplicarEstilosBotones(mensajeInicial);
            }

            const chatText = document.getElementById("chatText");
            if (chatText) {
                chatText.textContent = config.estilos.burbuja || "";
                chatText.style.backgroundColor = config.estilos.colorPrimario;
                chatText.style.color = config.estilos.colorTexto;
            }

            const chatToggle = document.querySelector(".toggle-icon");
            if (chatToggle) chatToggle.src = config.estilos.logo;
        }

    } catch (error) {
        console.error("Error al cargar la configuración:", error);
        agregarMensajeChatbot("Ocurrió un error al cargar la configuración del chatbot.");
    }
}

function aplicarColorBotonesSVG(color){
    const iconos = document.querySelectorAll(".chatbot-min svg, .chatbot-close svg");
    iconos.forEach(svg => {
        svg.style.color = color; // currentColor se aplicará automáticamente a fill o stroke
    });
}

// MODAL
function mostrarModalURL(mensaje) {
    const overlay = document.createElement("div");
    overlay.id = "modal-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0,0,0,0.6)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";

    overlay.innerHTML = `
        <div style="
            background-color: #fff;
            padding: 30px 40px;
            border-radius: 12px;
            text-align: center;
            max-width: 450px;
        ">
            <p style="color: #000000; font-weight: Montserrat, sans-serif ; font-size: 20px; margin-bottom: 20px;">
                ${mensaje}
            </p>
            <button id="cerrarModal" style="
                margin-top: 10px;
                padding: 8px 18px;
                border: none;
                border-radius: 6px;
                background-color: #002B45;
                color: #fff;
                cursor: pointer;
                font-size: 16px;
            ">Cerrar</button>
            <button id="irAdmin" style="
                margin-top: 10px;
                margin-left: 10px;
                padding: 8px 18px;
                border: none;
                border-radius: 6px;
                background-color: #1890ff;
                color: #fff;
                cursor: pointer;
                font-size: 16px;
            ">Ir al Centro de Administración</button>
        </div>
    `;

    document.body.appendChild(overlay);

    // Función para cerrar modal
    document.getElementById("cerrarModal").addEventListener("click", () => {
        overlay.remove();
    });

    // Función para redirigir al centro de administración
    document.getElementById("irAdmin").addEventListener("click", () => {
        window.location.href = "http://localhost/Chatbot-AdminCenter/index.php";
    });
}

// -------------------- MANEJAR TEMAS --------------------
function manejarTema(conver) {
    if (temaEnCurso) return; // Si ya hay un tema en curso, no hacer nada
    if (!conver) return;

    temaEnCurso = true; // Marca que se inició un tema

    agregarMensajeChatbot(conver.mensaje || "Selecciona una opción:");

    if (conver.urlInforme && conver.columna) {
        cargarCSV(conver.urlInforme, conver.columna);
    }

    if (conver.columna && conver.columna.toLowerCase() === "puesto") {
        seguimientoPostulacion();
    }
}



//  CARGAR CSV 
function cargarCSV(url, columnaClave) {
    Papa.parse(url, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            // Guardamos los datos según la columna del tema
            csvDataPorColumna[columnaClave] = results.data;

            mostrarSelect(
                columnaClave,
                `Buscando vacantes en`,
                `seleccion-${columnaClave}`,
                `Seleccione una opción`
            );
        },
        error: function (err) {
            agregarMensajeChatbot("No se pudo cargar la lista de opciones.");
            console.error(err);
        }
    });
}

function mostrarSelect(columnaClave, mensajeUsuario, selectId, textoDefault) {
    const contenedor = document.querySelector(".chatbot-body");

    const selectExistente = document.getElementById(selectId);
    if (selectExistente) selectExistente.remove();

    const select = document.createElement("select");
    select.id = selectId;
    select.style.marginTop = "10px";

    select.onchange = function () {
        const valorSeleccionado = this.value;

       const div = document.createElement("div");
            div.className = "user-message2"; 
            div.innerHTML = `${mensajeUsuario} ${valorSeleccionado}...`;

            if (windowConfig.estilos) {
                div.style.backgroundColor = windowConfig.estilos.colorRespuestaUsuario;
                div.style.color = windowConfig.estilos.colorTexto;
                div.style.borderRadius = "12px";
                div.style.padding = "8px 12px";
                div.style.maxWidth = "80%";
                div.style.margin = "5px 0";
            }

            contenedor.appendChild(div);
            div.scrollIntoView({ behavior: "smooth" });

        select.disabled = true;

        // Usar CSV correspondiente a esta columna
        const csvData = csvDataPorColumna[columnaClave] || [];
        const resultados = csvData.filter(item => item[columnaClave] === valorSeleccionado);

        if (resultados.length === 0) {
            agregarMensajeChatbot(`No se encontraron resultados en ${valorSeleccionado}`);
        } else {
            agregarMensajeChatbot(`Resultados encontrados en ${valorSeleccionado}:`);
            resultados.forEach(emp => {
                let mensaje = "<div class='resultado-csv'>";
                let link = null; // Guardar aquí el link si existe

                for (const key in emp) {
                    if (emp.hasOwnProperty(key) && emp[key]) {
                        if (key.toLowerCase() === "link") {
                            link = emp[key]; // Guardar el link para mostrar al final
                        } else {
                            mensaje += `<p><strong>${key}:</strong> ${emp[key]}</p>`;
                        }
                    }
                }

                // Mostrar el link al final si existe
                if (link) {
                    mensaje += `<p><a href="${link}" target="_blank">Postúlate</a></p>`;
                }

                mensaje += "</div>";
                agregarMensajeChatbot(mensaje);
            });

        }
        setTimeout(confirmacionAyuda, 1000);
    };

    const csvData = csvDataPorColumna[columnaClave] || [];
    const opcionesUnicas = [...new Set(csvData.map(row => row[columnaClave]).filter(Boolean))];

    const defaultOption = document.createElement("option");
    defaultOption.text = textoDefault;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    opcionesUnicas.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.text = opt;
        select.appendChild(option);
    });

    contenedor.appendChild(select);
    select.scrollIntoView({ behavior: "smooth" });
    aplicarEstilosBotones(contenedor);
}

// -------------------- MOSTRAR EMPLEOS --------------------
function mostrarEmpleos(categoria, columnaClave) {
    const empleos = csvData.filter(row => row[columnaClave] === categoria);
    if (empleos.length === 0) {
        agregarMensajeChatbot(`No hay vacantes en la categoría ${categoria}`);
        return;
    }

    agregarMensajeChatbot(`Vacantes encontradas en ${categoria}:`);

    empleos.forEach(emp => {
        const contenedor = document.querySelector(".chatbot-body");
        const div = document.createElement("div");
        div.classList.add("chatbot-message");

        const link = document.createElement("a");
        link.href = emp.link; // columna "link" en tu CSV
        link.textContent = emp.titulo || "Ver empleo";
        link.target = "_blank";

        div.appendChild(link);
        contenedor.appendChild(div);
    });

    confirmacionAyuda();
}
// FUNCIONES DEL CHATBOT
function toggleChatbot() {
    const chatbotContainer = document.getElementById("chatbot-container");
    const chatToggle = document.getElementById("chatbot-toggle");
    const chatText = document.getElementById("chatText");

    chatbotMinimizado = !chatbotMinimizado;

    if (chatbotContainer.classList.contains("open")) {
        chatbotContainer.classList.remove("open");
        chatToggle.classList.add("burbuja-parpadeante");
        setTimeout(() => chatText.classList.remove("hidden"), 500);
    } else {
        chatToggle.classList.remove("burbuja-parpadeante");
        chatText.classList.add("hidden");
        chatbotContainer.style.display = "block";
        setTimeout(() => chatbotContainer.classList.add("open"), 10);
    }
}

function cerrar() {
    const contenidoInicial = `
          <div id="mensaje-inicial" class="chatbot-message">
              <p>${windowConfig.estilos.saludo || "¡Hola! Soy tu asistente virtual!"}</p>
              <div class="chatbot-button-container">
                  <button onclick="mostrarPreguntaPerfil()">Buscar vacantes por categoría</button>
                  <button onclick="iniciarBusquedaPorUbicacion()">Buscar vacantes por ubicación</button>
                  <button onclick="seguimientoPostulacion()">Seguimiento de mi postulación</button>
              </div>
          </div>`;
    const chatbotBody = document.querySelector(".chatbot-body");
    chatbotBody.innerHTML = contenidoInicial;
    aplicarEstilosBotones(chatbotBody);
    toggleChatbot();
}

// -------------------- INICIALIZACIÓN --------------------
document.addEventListener("DOMContentLoaded", () => {
    cargarConfigChatbot();

    const chatToggle = document.getElementById("chatbot-toggle");
    chatToggle.classList.add("burbuja-parpadeante");
    chatToggle.addEventListener("click", toggleChatbot);

    const inputPerfil = document.getElementById("user-input");
    if (inputPerfil) {
        inputPerfil.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                enviarRespuesta();
            }
        });
    }
});

// -------------------- FUNCIONES DE MENSAJES --------------------
function agregarMensajeChatbot(texto) {
    const contenedor = document.querySelector(".chatbot-body");
    const div = document.createElement("div");
    div.className = "chatbot-message";
    div.innerHTML = texto;
    contenedor.appendChild(div);
    div.scrollIntoView({ behavior: "smooth" });
    aplicarEstilosBotones(div);
}

function agregarMensajeUsuario(texto) {
    if (texto.trim() === "") return;
    const contenedor = document.querySelector(".chatbot-body");
    const div = document.createElement("div");
    div.className = "user-message2";
    div.innerHTML = `<p>${texto}</p>`;
    contenedor.appendChild(div);

    if (windowConfig.estilos) {
        div.style.backgroundColor = windowConfig.estilos.colorRespuestaUsuario;
        div.style.color = windowConfig.estilos.colorTexto;
    }

    div.scrollIntoView({ behavior: "smooth" });
}
///////////////////////////////////////////////////////////////////////////////////
function mostrarPreguntaPerfil() {
    // Tomamos el primer tema que tenga CSV y NO sea seguimiento ("puesto")
    const conver = windowConfig.conversacion.find(
        c => c.urlInforme && c.columna.toLowerCase() !== "puesto"
    );
    if (conver) {
        agregarMensajeChatbot(conver.mensaje);
        cargarCSV(conver.urlInforme, conver.columna);
    }
}

function iniciarBusquedaPorUbicacion() {
    // Tomamos otro tema que tenga CSV y NO sea seguimiento ("puesto")
    const conver = windowConfig.conversacion.find(
        c => c.urlInforme && c.columna.toLowerCase() !== "puesto" && c.tema.toLowerCase().includes("ubicación")
    );
    if (conver) {
        agregarMensajeChatbot(conver.mensaje);
        cargarCSV(conver.urlInforme, conver.columna);
    } else {
        agregarMensajeChatbot("No hay información disponible para ubicaciones.");
    }
}




//SEGUIMIENTO DE POSTULACIONES 
function seguimientoPostulacion() {
    flujoConversacion = "seguimiento";
    estadoConversacion = "preguntaCorreo";
    agregarMensajeChatbot("Ingresa tu correo electrónico para verificar tus postulaciones:");
    const inputContainer = document.getElementById("user-input-container");
    if (inputContainer) inputContainer.style.display = "block";
    const userInput = document.getElementById("user-input");
    if (userInput) {
        userInput.disabled = false;
        userInput.focus();
    }
}

function enviarRespuesta() {
    const userInputField = document.getElementById("user-input");
    const userInput = userInputField.value.trim();
    if (userInput === "") return;

    agregarMensajeUsuario(userInput);

    if (flujoConversacion === "seguimiento") {
        manejarFlujoSeguimiento(userInput);
    }
}

function manejarFlujoSeguimiento(userInput) {
    if (estadoConversacion === "preguntaCorreo") {
        if (validateEmail(userInput)) {
            fetch("csvtest.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: userInput })
            }).then(res => res.json())
                .then(data => {
                    if (data.length > 0) {
                        agregarMensajeChatbot("Postulaciones encontradas:");
                        data.forEach(item => {
                            agregarMensajeChatbot(
                                `<p>${item.puesto}</p><p>${item.nombre} ${item.apellido}</p><p>${item.correo}</p><p>Estatus: ${item.estatus}</p>`
                            );
                        });
                    } else {
                        agregarMensajeChatbot("No encontré coincidencias con ese correo.");
                    }
                    document.getElementById("user-input").value = "";
                    confirmacionAyuda();
                }).catch(err => {
                    agregarMensajeChatbot("Ocurrió un error al procesar la solicitud.");
                    console.error(err);
                });
            estadoConversacion = "Finalizado";
        } else {
            agregarMensajeChatbot("Correo inválido, ingresa uno válido.");
        }
    }
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// CONFIRMACIÓN FINAL
function confirmacionAyuda() {
    const htmlBotones = `
          <div class="chatbot-message-buttons" style="margin-top: 20px;">
              <button class="btnSi" style="margin-right: 5px; border-radius: 15px; padding: 4px 12px;">Sí</button>
              <button class="btnNo" style="border-radius: 15px; padding: 4px 10px;"  >No</button>
          </div>`;
    agregarMensajeChatbot("¿Puedo ayudarte con algo más? " + htmlBotones);
    const inputContainer = document.getElementById("user-input-container");
    if (inputContainer) inputContainer.style.display = "none";

    setTimeout(() => {
        const contenedor = document.querySelector(".chatbot-body");
        const botones = contenedor.querySelectorAll(".chatbot-message-buttons");
        const ultimo = botones[botones.length - 1];

        ultimo.querySelector(".btnSi").addEventListener("click", () => {
            funcionSi();
            bloquearBotones(ultimo);
        });
        ultimo.querySelector(".btnNo").addEventListener("click", () => {
            funcionNo();
            bloquearBotones(ultimo);
        });
    }, 0);
}

function bloquearBotones(ultimo) {
    ultimo.querySelector(".btnSi").disabled = true;
    ultimo.querySelector(".btnNo").disabled = true;
}

function funcionSi() {
     temaEnCurso = false; 
    const contenidoInicial = `
          <div id="mensaje-inicial" class="chatbot-message">
              <p>¡Con gusto! ¿En qué más puedo ayudarte?</p>
              <div class="chatbot-button-container">
                  <button onclick="mostrarPreguntaPerfil()">Buscar vacantes por categoría</button>
                  <button onclick="iniciarBusquedaPorUbicacion()">Buscar vacantes por ubicación</button>
                  <button onclick="seguimientoPostulacion()">Seguimiento de mi postulación</button>
              </div>
          </div>`;
    const contenedor = document.querySelector(".chatbot-body");
    contenedor.insertAdjacentHTML("beforeend", contenidoInicial);
    contenedor.lastElementChild.scrollIntoView({ behavior: "smooth" });
    aplicarEstilosBotones(contenedor.lastElementChild);
}

function funcionNo() {
    setTimeout(() => {
         temaEnCurso = false; 
        agregarMensajeChatbot(`<div style="text-align:center;"><p>${windowConfig.despedida || "¡Gracias por usar nuestro asistente virtual!"}</p></div>`);
    }, 500);
    setTimeout(cerrar, 3500);
}
