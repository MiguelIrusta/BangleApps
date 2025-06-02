// Variable para almacenar el último mensaje recibido
let lastMessage = "";
let isAppVisible = false; // Track if app is currently visible
let originalApp = null; // Store the original app to return to

// Función para mostrar popup inicial y luego ir al background
function showInitialPopup() {
  g.clear();
  g.setColor(0, 0, 0.8); // Fondo azul oscuro
  g.fillRect(0, 0, 176, 176);
  
  g.setColor(1, 1, 1); // Texto blanco
  g.setFont("6x8", 2);
  
  // Centrar el texto
  let text1 = "Pleez will run in";
  let text2 = "back plain now";
  let w1 = g.stringWidth(text1);
  let w2 = g.stringWidth(text2);
  
  g.drawString(text1, (176 - w1) / 2, 70);
  g.drawString(text2, (176 - w2) / 2, 90);
  
  g.flip();
  
  // Después de 3 segundos, ir al background
  setTimeout(function() {
    goToBackground();
  }, 3000);
}

// Función para ir al background (ocultar la app)
function goToBackground() {
  isAppVisible = false;
  // Volver a la aplicación anterior o al reloj principal
  if (originalApp) {
    load(originalApp);
  } else {
    load(); // Cargar la app por defecto (reloj)
  }
}

// Función para mostrar la app (traerla al frente)
function showApp() {
  isAppVisible = true;
  redrawScreen();
}

// Función para manejar mensajes recibidos desde la app del teléfono
function onGB(event) {
  let parsedEvent;
  
  // Si event es una cadena, intentar parsearla como JSON
  if (typeof event === 'string') {
    try {
      parsedEvent = JSON.parse(event);
      console.log("JSON parseado:", parsedEvent);
    } catch (e) {
      console.log("Error parseando JSON:", e);
      console.log("Mensaje recibido:", event);
      return;
    }
  } else {
    parsedEvent = event;
  }
  
  if (parsedEvent.t === "notify") {
    lastMessage = parsedEvent.msg;
    console.log("Mensaje procesado:", parsedEvent.msg);
    
    // Si recibimos "FinTimer", ocultar la app
    if (parsedEvent.msg === "FinTimer") {
      console.log("FinTimer recibido, ocultando app");
      goToBackground();
      return;
    }
    
    // Para cualquier otro mensaje, mostrar la app
    console.log("Mostrando app, isAppVisible:", isAppVisible);
    if (!isAppVisible) {
      showApp();
    } else {
      redrawScreen(); // Si ya está visible, solo redibujar
    }
  }
}

// Dibujar la pantalla completa (mensaje y botones)
function redrawScreen() {
  g.clear(); // Limpiar la pantalla
  g.setColor(0, 0, 1); // Fondo azul
  g.fillRect(0, 0, 176, 176);
  
  // Mostrar mensaje en la parte superior
  g.setColor(1, 1, 1); // Texto blanco
  g.setFont("6x8", 2); // Fuente para el mensaje
  g.drawString("Señal: " + lastMessage, 10, 10); // Mensaje en y=10
  
  // Dibujar botones (en la parte inferior)
  // Botón 1: Ok (verde)
  g.setColor(0, 1, 0); // Fondo verde
  g.fillRect(10, 80, 86, 166); // 88 píxeles de ancho
  
  // Botón 2: Postpone (rojo)
  g.setColor(1, 0, 0); // Fondo rojo
  g.fillRect(90, 80, 166, 166);
  
  // Dibujar texto encima de los botones
  g.setColor(1, 1, 1); // Texto blanco
  g.setFont("6x8", 3); // Fuente clara para los botones
  g.drawString("Ok", 20, 110); // Centrado en el botón
  g.drawString("Post", 95, 110); // Centrado en el botón
  
  g.flip(); // Actualizar pantalla
}

// Feedback visual para un botón
function buttonFeedback(x1, x2, y1, y2, isOkButton) {
  g.setColor(isOkButton ? 0 : 0.5, isOkButton ? 0.5 : 0, 0); // Verde oscuro para Ok, rojo oscuro para Post
  g.fillRect(x1, y1, x2, y2);
  g.setColor(1, 1, 1); // Texto blanco
  g.setFont("6x8", 3);
  g.drawString(isOkButton ? "Ok" : "Post", x1 + 10, y1 + 30); // Re-dibujar texto
  g.flip();
}

// Manejar toques en la pantalla
Bangle.on("touch", function (button, xy) {
  // Solo procesar toques si la app está visible
  if (!isAppVisible) return;
  
  console.log("Toque en: x=" + xy.x + ", y=" + xy.y); // Depuración de coordenadas
  
  if (xy.y >= 80 && xy.y <= 166) { // Área de los botones
    let message;
    let isOkButton = false;
    
    if (xy.x >= 10 && xy.x <= 86) {
      message = "Ok";
      isOkButton = true;
    } else if (xy.x >= 90 && xy.x <= 166) {
      message = "Postpone";
    }
    
    if (message) {
      console.log("Botón pulsado:", message); // Confirmar botón pulsado
      
      // Mostrar feedback visual
      buttonFeedback(
        isOkButton ? 10 : 90,
        isOkButton ? 86 : 166,
        80,
        166,
        isOkButton
      );
      
      // Enviar mensaje a la app después de un pequeño retraso
      setTimeout(function () {
        Bluetooth.println(JSON.stringify({ t: "notify", msg: message }));
        
        // Después de enviar el mensaje, ir al background
        setTimeout(function() {
          goToBackground();
        }, 500); // Pequeño retraso para que se vea el feedback
        
      }, 200); // Retraso de 200ms para ver el feedback
      
    } else {
      console.log("Toque fuera de los botones"); // Depuración
    }
  } else {
    console.log("Toque fuera del área de los botones"); // Depuración
    // Si tocan fuera de los botones, también ocultar la app
    goToBackground();
  }
});

// Guardar referencia a la app actual antes de empezar
if (typeof global.currentApp !== 'undefined') {
  originalApp = global.currentApp;
}

// Inicializar el manejador de eventos
GB = onGB; // Registrar el manejador de eventos

// Mostrar popup inicial al arrancar
showInitialPopup();

// Asegurar que la Bangle.js esté en modo conectable
NRF.setAdvertising({}, { connectable: true });

// Desactivar eventos de actividad para evitar logs innecesarios
Bangle.setOptions({ hrmPollInterval: 0, stepCountInterval: 0 });
