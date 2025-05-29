// Variable para almacenar el último mensaje recibido
let lastMessage = "";

// Mostrar mensaje de inicio (popup)
function showStartupMessage() {
  g.clear();
  g.setColor(0, 0, 1); // Fondo azul
  g.fillRect(0, 0, 176, 176);
  g.setColor(1, 1, 1); // Texto blanco
  g.setFont("6x8", 2);
  g.drawString("Pleez corriendo en segundo plano", 10, 70);
  g.flip();
  setTimeout(function () {
    Bangle.showClock(); // Volver al reloj
  }, 2000);
}

// Función para manejar mensajes recibidos desde la app del teléfono
function onGB(event) {
  if (event.t === "notify") {
    if (event.msg === "FinTimer") {
      console.log("Recibido FinTimer, volviendo al reloj");
      Bangle.showClock(); // Volver al reloj
    } else {
      lastMessage = event.msg; // Guardar el mensaje
      Bangle.loadWidgets(); // Cargar widgets para mostrar la interfaz
      redrawScreen(); // Redibujar todo
      console.log("Mensaje recibido:", event.msg); // Depuración
    }
  }
}

// Dibujar la pantalla completa (mensaje y botones)
function redrawScreen() {
  g.clear(); // Limpiar la pantalla
  g.setColor(0, 0, 1); // Fondo azul
  g.fillRect(0, 0, 176, 176);

  // Mostrar mensaje completo en la parte superior
  g.setColor(1, 1, 1); // Texto blanco
  g.setFont("6x8", 2); // Fuente para el mensaje
  g.drawString(lastMessage, 10, 10); // Mostrar solo el mensaje

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
      // Enviar mensaje a la app y volver al reloj después de un retraso
      setTimeout(function () {
        Bluetooth.println(JSON.stringify({ t: "notify", msg: message }));
        Bangle.showClock(); // Volver al reloj
      }, 200); // Retraso de 200ms para ver el feedback
    } else {
      console.log("Toque fuera de los botones"); // Depuración
    }
  } else {
    console.log("Toque fuera del área de los botones"); // Depuración
  }
});

// Configurar la app para segundo plano
Bangle.setUI("none"); // No toma control de la UI
GB = onGB; // Registrar el manejador de eventos

// Mostrar mensaje de inicio
setTimeout(showStartupMessage, 100); // Retraso para evitar conflictos

// Asegurar que la Bangle.js esté en modo conectable
NRF.setAdvertising({}, { connectable: true });

// Desactivar eventos de actividad para evitar logs innecesarios
Bangle.setOptions({ hrmPollInterval: 0, stepCountInterval: 0 });
