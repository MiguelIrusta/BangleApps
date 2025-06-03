// Variable para almacenar el último mensaje recibido
let lastMessage = "";
let isAppVisible = false;
let originalApp = null;

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

// Función para manejar mensajes recibidos
function onGB(event) {
  Bluetooth.println(JSON.stringify({ t: "debug", msg: "Evento GB recibido: " + JSON.stringify(event) }));
  
  let parsedEvent;
  if (typeof event === 'string') {
    try {
      parsedEvent = JSON.parse(event);
      Bluetooth.println(JSON.stringify({ t: "debug", msg: "JSON parseado: " + JSON.stringify(parsedEvent) }));
    } catch (e) {
      Bluetooth.println(JSON.stringify({ t: "debug", msg: "Error parseando JSON: " + e.toString() }));
      Bluetooth.println(JSON.stringify({ t: "debug", msg: "Mensaje crudo: " + event }));
      return;
    }
  } else {
    parsedEvent = event;
    Bluetooth.println(JSON.stringify({ t: "debug", msg: "Evento ya es objeto: " + JSON.stringify(parsedEvent) }));
  }
  
  if (parsedEvent.t === "notify" && parsedEvent.msg) {
    lastMessage = parsedEvent.msg;
    Bluetooth.println(JSON.stringify({ t: "debug", msg: "Mensaje procesado: " + lastMessage }));
    
    if (lastMessage === "FinTimer") {
      Bluetooth.println(JSON.stringify({ t: "debug", msg: "FinTimer recibido, ocultando app" }));
      goToBackground();
      return;
    }
    
    Bluetooth.println(JSON.stringify({ t: "debug", msg: "Mostrando app, isAppVisible: " + isAppVisible }));
    showApp();
  } else {
    Bluetooth.println(JSON.stringify({ t: "debug", msg: "Evento no válido, esperado t:notify con msg" }));
  }
}

// Capturar datos BLE crudos para depuración
NRF.on('characteristicvaluechanged', function(event) {
  Bluetooth.println(JSON.stringify({ t: "debug", msg: "Datos BLE recibidos: " + JSON.stringify(event) }));
});

// Guardar referencia a la app actual
if (typeof global.currentApp !== 'undefined') {
  originalApp = global.currentApp;
}

// Registrar el manejador de eventos
GB = onGB;

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
