// Variable para almacenar el último mensaje recibido
let lastMessage = "";

// Función para manejar mensajes recibidos desde Gadgetbridge
function onGB(event) {
  if (event.t === "notify" && event.src === "Gadgetbridge") {
    lastMessage = event.msg; // Guardar el mensaje
    redrawScreen(); // Redibujar todo
    console.log("Mensaje recibido:", event.msg); // Depuración
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

// Manejar toques en la pantalla
Bangle.on("touch", function (button, xy) {
  console.log("Toque en: x=" + xy.x + ", y=" + xy.y); // Depuración de coordenadas
  if (xy.y >= 80 && xy.y <= 166) { // Área de los botones
    let message;
    if (xy.x >= 10 && xy.x <= 86) {
      message = "Ok";
    } else if (xy.x >= 90 && xy.x <= 166) {
      message = "Postpone";
    }
    if (message) {
      console.log("Botón pulsado:", message); // Confirmar botón pulsado
      // Enviar mensaje a Gadgetbridge
      Bluetooth.println(JSON.stringify({ t: "notify", msg: message }));
    } else {
      console.log("Toque fuera de los botones"); // Depuración
    }
  } else {
    console.log("Toque fuera del área de los botones"); // Depuración
  }
});

// Inicializar Gadgetbridge
GB = onGB; // Registrar el manejador de eventos
redrawScreen(); // Inicializar la interfaz

// Asegurar que la Bangle.js esté en modo conectable
NRF.setAdvertising({}, { connectable: true });

// Desactivar eventos de actividad para evitar logs innecesarios
Bangle.setOptions({ hrmPollInterval: 0, stepCountInterval: 0 });
