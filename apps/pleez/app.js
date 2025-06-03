// Variable para almacenar el último mensaje recibido
let lastMessage = "";
let isAppVisible = false;
let originalApp = null;

// Enviar log al iniciar para confirmar que el código se ejecuta
Bluetooth.println(JSON.stringify({ t: "debug", msg: "App iniciada" }));

// Función para mostrar popup inicial y luego ir al background
function showInitialPopup() {
  g.clear();
  g.setColor(0, 0, 0.8);
  g.fillRect(0, 0, 176, 176);
  
  g.setColor(1, 1, 1);
  g.setFont("6x8", 2);
  
  let text1 = "Pleez will run in";
  let text2 = "background now";
  let w1 = g.stringWidth(text1);
  let w2 = g.stringWidth(text2);
  
  g.drawString(text1, (176 - w1) / 2, 70);
  g.drawString(text2, (176 - w2) / 2, 90);
  
  g.flip();
  
  setTimeout(function() {
    goToBackground();
  }, 3000);
}

// Función para ir al background
function goToBackground() {
  isAppVisible = false;
  if (originalApp) {
    load(originalApp);
  } else {
    load();
  }
}

// Función para mostrar la app
function showApp() {
  isAppVisible = true;
  redrawScreen();
}

// Función para dibujar la pantalla
function redrawScreen() {
  g.clear();
  g.setColor(0, 0, 1);
  g.fillRect(0, 0, 176, 176);
  
  g.setColor(1, 1, 1);
  g.setFont("6x8", 2);
  g.drawString("Señal: " + lastMessage, 10, 10);
  
  g.setColor(0, 1, 0);
  g.fillRect(10, 80, 86, 166);
  g.setColor(1, 0, 0);
  g.fillRect(90, 80, 166, 166);
  
  g.setColor(1, 1, 1);
  g.setFont("6x8", 3);
  g.drawString("Ok", 20, 110);
  g.drawString("Post", 95, 110);
  
  g.flip();
  Bluetooth.println(JSON.stringify({ t: "debug", msg: "Pantalla redibujada" }));
}

// Capturar datos BLE crudos
NRF.on('characteristicvaluechanged', function(event) {
  let value = event.value; // Valor recibido en la característica
  let data = "";
  try {
    // Convertir el buffer a string
    for (let i = 0; i < value.length; i++) {
      data += String.fromCharCode(value[i]);
    }
    Bluetooth.println(JSON.stringify({ t: "debug", msg: "Datos BLE recibidos: " + data }));
  } catch (e) {
    Bluetooth.println(JSON.stringify({ t: "debug", msg: "Error procesando datos BLE: " + e.toString() }));
  }
});

// Manejador GB simplificado
GB = function(event) {
  Bluetooth.println(JSON.stringify({ t: "debug", msg: "Evento GB recibido: " + JSON.stringify(event) }));
  try {
    let parsedEvent = typeof event === 'string' ? JSON.parse(event) : event;
    lastMessage = parsedEvent.msg || "Sin mensaje";
    Bluetooth.println(JSON.stringify({ t: "debug", msg: "Mensaje procesado: " + lastMessage }));
    showApp();
  } catch (e) {
    Bluetooth.println(JSON.stringify({ t: "debug", msg: "Error en GB: " + e.toString() }));
  }
};

// Guardar referencia a la app actual
if (typeof global.currentApp !== 'undefined') {
  originalApp = global.currentApp;
}

// Asegurar modo conectable
NRF.setAdvertising({}, { connectable: true });

// Desactivar funciones que puedan interferir
Bangle.setOptions({ hrmPollInterval: 0 });
if (Bangle.setStepCount) Bangle.setStepCount(0);
Bangle.removeAllListeners('step');
Bangle.removeAllListeners('health');
Bangle.removeAllListeners('HRM');

// Mostrar popup inicial
showInitialPopup();
