

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
//-------------CARGAR JSON-------------------
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

        if (config.estilos.colorTexto) {
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

function aplicarColorBotonesSVG(color) {
  const iconos = document.querySelectorAll(".chatbot-min svg, .chatbot-close svg");
  iconos.forEach(svg => {
    svg.style.color = color; // currentColor se aplicará automáticamente a fill o stroke
  });
}

// -------------MODAL DE VERIFICACIÓN DE URL----------------------------------------------
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
  if (temaEnCurso) return;
  if (!conver) return;

  temaEnCurso = true;
  agregarMensajeChatbot(conver.mensaje || "Selecciona una opción:");

  if (conver.urlInforme && conver.columna) {
    const esSeguimiento = conver.tema.toLowerCase().includes("seguimiento");
    if (esSeguimiento) {
      seguimientoPostulacion(); // Mostrar input
    } else {
      cargarCSV(conver.urlInforme, conver.columna, false);
    }
  }
}



//  CARGAR CSV 
function cargarCSV(url, columnaClave, esSeguimiento = false) {
  Papa.parse(url, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      // Guardar los datos por columna
      csvDataPorColumna[columnaClave] = results.data;

      // Si no es seguimiento, mostrar select
      if (!esSeguimiento) {
        // Limpiar select anterior de la misma columna
        const selectExistente = document.getElementById(`seleccion-${columnaClave}`);
        if (selectExistente) selectExistente.remove();

        mostrarSelect(
          columnaClave,
          `Buscando vacantes en`,
          `seleccion-${columnaClave}`,
          `Seleccione una opción`
        );
      }
    },
    error: function (err) {
      agregarMensajeChatbot("No se pudo cargar la lista de opciones.");
      console.error(err);
    }
  });
}
//--------------------------FUNCIÓN PARA MOSTRAR EL SELECT DE LAS OPCIONES DE VACANTES------------------
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
        let link = null; 

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
          if (windowConfig.funcionamiento && windowConfig.funcionamiento.integracionActiva === true) {
            mensaje += `
            <button class="btn btn-primary" onclick="abrirModalPostulacion('${emp['ID de requisición de personal']}')">
                Postúlate
            </button>
        `;
          } else {
            mensaje += `<p><a href="${link}" target="_blank">Postúlate</a></p>`;
          }
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
  // Tomamos el primer tema que tenga CSV 
  const conver = windowConfig.conversacion.find(
    c => c.urlInforme && c.columna.toLowerCase() !== "puesto"
  );
  if (conver) {
    agregarMensajeChatbot(conver.mensaje);
    cargarCSV(conver.urlInforme, conver.columna);
  }
}

function iniciarBusquedaPorUbicacion() {
  // Tomamos otro tema que tenga CSV
  const conver = windowConfig.conversacion.find(
    c => c.urlInforme && c.columna.toLowerCase() !== "puesto" && c.tema.toLowerCase().includes("ubicación")
  );
  if (conver) {
    agregarMensajeChatbot(conver.mensaje);
    cargarCSV(conver.urlInforme, conver.columna, false);
  } else {
    agregarMensajeChatbot("No hay información disponible para ubicaciones.");
  }
}

//Modal del postulante
function abrirModalPostulacion(idRequisicion) {
    const id_emp = document.getElementById('nomEmp').value;

    // Eliminar modal previo
    const existente = document.getElementById("modal-postulacion");
    if (existente) existente.remove();

    // Crear nuevo modal
    const modalHTML = `
    <div class="modal fade" id="modal-postulacion" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">

          <div class="modal-header">
            <h5 class="modal-title">Completa tu postulación</h5>
            <button type="button" class="close"  data-dismiss="modal" aria-label="Cerrar">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <form id="formPostulacion" enctype="multipart/form-data">
            <div class="modal-body">

              <!-- Paso 1: Ingresar correo -->
              <div id="paso1">
                <div class="form-group mb-3">
                  <label>Correo electrónico</label>
                  <input type="email" id="correo_candidate" name="correo_candidate"
                         class="form-control" style="border-radius:25px;">
                </div>
                <button type="button" class="btn btn-primary" id="btnVerificarCorreo">Siguiente</button>
              </div>

              <!-- Paso 1.5: Ingresar token (solo si el correo ya existe) -->
              <div id="pasoToken" style="display:none;">
                <div class="form-group mb-3">
                  <label>Código de verificación</label>
                  <input type="text" id="token_verificacion" name="token_verificacion" class="form-control" style="border-radius:25px;">
                </div>
                <button type="button" class="btn btn-primary" id="btnVerificarToken">Verificar</button>
              </div>

              <!-- Paso 2: Datos completos -->
              <div id="paso2" style="display:none;">
                <div class="form-group mb-3">
                  <label>Nombre</label>
                  <input type="text" id="nombre_candidate" name="nombre_candidate"
                         class="form-control" style="border-radius:25px;">
                </div>
                <div class="form-group mb-3">
                  <label>Apellido Paterno</label>
                  <input type="text" id="apellidop_candidate" name="apellidop_candidate"
                         class="form-control" style="border-radius:25px;">
                </div>
                <div class="form-group mb-3">
                  <label>Apellido Materno</label>
                  <input type="text" id="apellidom_candidate" name="apellidom_candidate"
                         class="form-control" style="border-radius:25px;">
                </div>
                <div class="form-group mb-3">
                  <label>Teléfono</label>
                  <input type="text" id="tel_candidate" name="tel_candidate"
                         class="form-control" style="border-radius:25px;">
                </div>
                <div class="form-group mb-3">
                  <label>Currículum (PDF)</label>
                  <input type="file" id="CV_candidate" name="CV_candidate"
                         class="form-control" style="border-radius:25px;">
                </div>
                <div id="cvInfo"></div>
              </div>

            </div>
            <div class="modal-footer">
              <button type="submit" id="btnEnviar" class="btn btn-success" style="display:none;">Enviar</button>
              <button type="button" class="btn btn-secondary"  data-dismiss="modal">Cancelar</button>
            </div>
          </form>

        </div>
      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById("modal-postulacion");

    // Abrir modal
    $(modal).modal('show');

    // Limpiar blur y aplicar al abrir
    const bodyChildren = Array.from(document.body.children).filter(c => c !== modal);
    bodyChildren.forEach(el => el.classList.add('blur-background'));

    $(modal).on('hidden.bs.modal', function () {
        bodyChildren.forEach(el => el.classList.remove('blur-background'));
        modal.remove();
    });

    aplicarEstilosModal();

        $('#formPostulacion').on('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    });

    // ------------------ Función para mostrar Paso 2 ------------------
function mostrarPaso2(datos = {}) {
    $('#paso1, #pasoToken').hide();
    $('#paso2').show();

    // Llenar campos del candidato
    $('#nombre_candidate').val(datos.nombre_candidate || '');
    $('#apellidop_candidate').val(datos.apellidop_candidate || '');
    $('#apellidom_candidate').val(datos.apellidom_candidate || '');
    $('#tel_candidate').val(datos.tel_candidate || '');

    // Mostrar CV existente si existe
    if (datos.cv_link && datos.cv_link !== 'null' && datos.cv_link !== '') {
        $('#cvInfo').html(`
            <p>Ya tienes un CV cargado: 
                <a href="${datos.cv_link}" target="_blank">Ver/Descargar CV</a>
            </p>
            <p>Si deseas actualizarlo, sube un nuevo archivo PDF. De lo contrario, deja este campo vacío.</p>
        `);
    } else {
        $('#cvInfo').html('');
    }

    $('#btnEnviar').show();
}
    // ------------------ Verificar correo ------------------
    $('#btnVerificarCorreo').off('click').on('click', function () {
        const correo = $('#correo_candidate').val().trim();
        if (!validateEmail(correo)) { alert("Ingresa un correo válido"); return; }

        fetch("http://localhost/Chatbot-AdminCenter/modelo/guardarPostulacion.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo_candidate: correo })
        })
        .then(res => res.json())
        .then(data => {
           
          if (manejarSesionExpirada(data)) return; 
           // <<--- Checar sesión expirada
            if (data.requiere_token) {
                // Paso token
                $('#paso1').hide();
                $('#pasoToken').show();

                $('#btnVerificarToken').off('click').on('click', function () {
                    const tokenIngresado = $('#token_verificacion').val().trim();
                    fetch("http://localhost/Chatbot-AdminCenter/modelo/guardarPostulacion.php", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ correo_candidate: correo, token: tokenIngresado })
                    })
                    .then(res => res.json())
                    .then(resp => {
                        if(resp.valido) {
                            mostrarPaso2(resp.datosCandidato || resp);
                        } else {
                            alert(resp.mensaje || "Código incorrecto");
                        }
                    });
                });

            } else {
                // Paso 2 directo
                mostrarPaso2(data.datosCandidato || {
                    nombre_candidate: data.nombre_candidate,
                    apellidop_candidate: data.apellidop_candidate,
                    apellidom_candidate: data.apellidom_candidate,
                    tel_candidate: data.tel_candidate,
                     cv_link: data.cv_link
                });
            }
        })
        .catch(err => {
            console.error(err);
            alert("Error al verificar el correo");
        });
    });
  // ------------------ Validación CV ------------------
  $('#CV_candidate').on('change', function () {
    const file = this.files[0];
    const cvInfo = $('#cvInfo');
    const btnEnviar = $('#btnEnviar');

    if (file) {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 5) {
        cvInfo.html(`<p style="color:red;">El archivo es demasiado grande. Máximo permitido: 5 MB</p>`);
        btnEnviar.prop('disabled', true);
        this.value = "";
      } else {
        cvInfo.html(`<p style="color:green;">Archivo listo (${sizeMB.toFixed(2)} MB)</p>`);
        btnEnviar.prop('disabled', false);
      }
    } else {
      cvInfo.html('');
      btnEnviar.prop('disabled', false);
    }
  });

  // ------------------ Envío final ------------------
  $('#formPostulacion').on('submit', function (e) {
    e.preventDefault();
    const nombre = $('#nombre_candidate').val().trim();
    const apellidop = $('#apellidop_candidate').val().trim();
    const tel = $('#tel_candidate').val().trim();
    if (!nombre || !apellidop || !tel) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    const formData = new FormData(this);
    formData.append('idRequisicion', idRequisicion);
    formData.append('id_emp', id_emp);

    fetch("http://localhost/Chatbot-AdminCenter/modelo/guardarPostulacion.php", {
      method: "POST",
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (manejarSesionExpirada(data)) return;

      if (data.tipo === "alerta") {
        Swal.fire({ icon: 'error', title: 'Atención', text: data.mensaje });
      } else {
           Swal.fire({
      icon: 'success',
      title: '¡Éxito!',
      text: data.mensaje || "Postulación enviada correctamente",
        }).then(() => {
      $('#modal-postulacion').modal('hide'); // Cerrar modal con jQuery
    });
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error al enviar la postulación");
    });
  });


}


// ------------------ FUNCION GLOBAL PARA SESIÓN EXPIRADA ------------------
function manejarSesionExpirada(data) {
  if (data.sesion_expirada) {
    Swal.fire({
      icon: 'warning',
      title: 'Sesión expirada',
      text: data.mensaje || "Tu sesión ha expirado. Por favor, vuelve a iniciar el proceso.",
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#f39c12',
      allowOutsideClick: false
    }).then(() => {
      localStorage.clear();
      sessionStorage.clear();
      location.reload(); // reinicia el chatbot
    });
    return true; // indica que la sesión estaba expirada
  }
  return false;
}

// -------------------- SEGUIMIENTO DE POSTULACIONES --------------------
function seguimientoPostulacion() {
  flujoConversacion = "seguimiento";
  window.temaSeguimiento = windowConfig.conversacion.find(c => c.tema.toLowerCase().includes("seguimiento"));

  if (!window.temaSeguimiento) {
    agregarMensajeChatbot("No hay tema de seguimiento configurado.");
    return;
  }

  estadoConversacion = "preguntaUsuario";

  if (window.temaSeguimiento.urlInforme && window.temaSeguimiento.columna) {
    cargarCSV(window.temaSeguimiento.urlInforme, window.temaSeguimiento.columna, true);
  }

  // Mostrar input
  const inputContainer = document.getElementById("user-input-container");
  if (inputContainer) inputContainer.style.display = "flex";

  const userInput = document.getElementById("user-input");
  if (userInput) {
    userInput.disabled = false;
    userInput.value = "";
    userInput.focus();
  }

  const btnEnviar = inputContainer.querySelector("button");
  if (btnEnviar && windowConfig.estilos.colorPrimario) {
    btnEnviar.style.backgroundColor = windowConfig.estilos.colorPrimario;
    btnEnviar.style.color = windowConfig.estilos.colorTexto || "#fff";
    btnEnviar.style.borderColor = windowConfig.estilos.colorAcento || windowConfig.estilos.colorPrimario;
    btnEnviar.style.padding = "8px 15px";
    btnEnviar.style.borderRadius = "15px";
    btnEnviar.style.cursor = "pointer";
  }
}
//---------------FUNCIÓN DE MANEJO DEL FLUJO DEL SEGUIMIENTO-------------
function manejarFlujoSeguimiento(userInput) {
  if (estadoConversacion !== "preguntaUsuario") return;

  const columna = window.temaSeguimiento.columna;
  const csvData = csvDataPorColumna[columna] || [];
  const resultados = csvData.filter(item => item[columna] === userInput);

  if (resultados.length > 0) {
    agregarMensajeChatbot("Postulaciones encontradas:");

    resultados.forEach(item => {
      let html = "<div class='resultado-csv'>";
      Object.keys(item).forEach(col => {
        if (item[col]) html += `<p><strong>${col}:</strong> ${item[col]}</p>`;
      });
      html += "</div>";
      agregarMensajeChatbot(html);
    });
  } else {
    agregarMensajeChatbot("No se encontraron coincidencias con tu información.");
  }

  // Ocultar input
  const inputContainer = document.getElementById("user-input-container");
  if (inputContainer) inputContainer.style.display = "none";

  confirmacionAyuda();
  estadoConversacion = "finalizado";
}
//--------------------ESTILOS DEL JSON PARA EL MODAL
function aplicarEstilosModal() {
  if (!windowConfig.estilos) return;

  const btnSiguiente = document.getElementById("btnVerificarCorreo");
  const btnEnviar = document.getElementById("btnEnviar");
   const btnToken = document.getElementById("btnVerificarToken");
  const btnCancelar = document.querySelector("#modal-postulacion .btn-secondary");

  [btnSiguiente, btnEnviar, btnToken].forEach(btn => {
    if (btn) {
      btn.style.backgroundColor = windowConfig.estilos.colorPrimario;
      btn.style.color = windowConfig.estilos.colorTexto || "#fff";
      btn.style.border = "none";
      btn.style.padding = "8px 15px";
      btn.style.borderRadius = "15px";
      btn.style.cursor = "pointer";
      btn.style.transition = "background-color 0.3s ease, transform 0.1s ease";

      // Hover
      btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = windowConfig.estilos.colorAcento || windowConfig.estilos.colorPrimario;
      });
      btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = windowConfig.estilos.colorPrimario;
      });

      // Click efecto
      btn.addEventListener("mousedown", () => {
        btn.style.transform = "scale(0.95)";
      });
      btn.addEventListener("mouseup", () => {
        btn.style.transform = "scale(1)";
      });
    }
  });

  // Opcional: estilo para Cancelar
  if (btnCancelar) {
    btnCancelar.style.borderRadius = "15px";
    btnCancelar.style.padding = "8px 15px";
  }
}


// -------------------- ENVIAR RESPUESTA --------------------
function enviarRespuesta() {
  const userInputField = document.getElementById("user-input");
  const userInput = userInputField.value.trim();
  if (userInput === "") return;

  agregarMensajeUsuario(userInput);

  if (flujoConversacion === "seguimiento") {
    manejarFlujoSeguimiento(userInput);
  }

  userInputField.value = "";
}


// -------------------- MANEJO DEL FLUJO DE SEGUIMIENTO --------------------
function manejarFlujoSeguimiento(userInput) {
  if (estadoConversacion !== "preguntaUsuario") return;

  const columnaClave = window.temaSeguimiento.columna;
  const csvData = csvDataPorColumna[columnaClave] || [];

  const resultados = csvData.filter(item => {
    const valor = item[columnaClave] || "";
    return valor.toString().trim().toLowerCase() === userInput.toLowerCase().trim();
  });

  if (resultados.length > 0) {
    agregarMensajeChatbot("Postulaciones encontradas:");

    resultados.forEach(item => {
      let html = "<div class='resultado-csv'>";
      
      // Mostrar solo columnas "reales"
      Object.keys(item).forEach(col => {
        if (col && !col.startsWith("_")) { // Ignorar columnas automáticas de PapaParse
          html += `<p><strong>${col}:</strong> ${item[col] || '-'}</p>`;
        }
      });

      html += "</div>";
      agregarMensajeChatbot(html);
    });
  } else {
    agregarMensajeChatbot("No se encontraron coincidencias con tu información.");
  }

  // Ocultar input
  const inputContainer = document.getElementById("user-input-container");
  if (inputContainer) inputContainer.style.display = "none";

  confirmacionAyuda();
  estadoConversacion = "finalizado";
}

// -------------------- VALIDAR EMAIL --------------------
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
  //const inputContainer = document.getElementById("user-input-container");
  //if (inputContainer) inputContainer.style.display = "none";

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
