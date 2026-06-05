const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const pdfDir = path.join(__dirname, 'pdfs-generados');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir);
}

app.post('/api/generar-pdf', (req, res) => {
  try {
    const datos = req.body;
    const filename = 'autorizacion_' + Date.now() + '.pdf';
    const filepath = path.join(pdfDir, filename);

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50
    });
    
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    
    // PAGINA 1
    doc.fontSize(18).font('Helvetica-Bold').text('AUTORIZACION DE TRABAJO', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(11).font('Helvetica-Bold').text('INFORMACION GENERAL');
    doc.font('Helvetica').fontSize(10);
    doc.text('Empresa: ' + (datos.empresa || ''), 50);
    doc.text('Jefe de Proyecto: ' + (datos.jefeProyecto || ''), 50);
    doc.text('Identificacion de Tarea: ' + (datos.identificacionTarea || ''), 50);
    doc.text('Numero OT/LOS: ' + (datos.numeroOT || ''), 50);
    doc.text('Lugar Exacto: ' + (datos.lugarTarea || ''), 50);
    
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text('RESPONSABLES');
    doc.font('Helvetica').fontSize(10);
    doc.text('Supervisor: ' + (datos.supervisor || ''), 50);
    doc.text('Cargo: ' + (datos.cargoSupervisor || ''), 50);
    doc.text('Administrador: ' + (datos.administrador || ''), 50);
    doc.text('Cargo: ' + (datos.cargoAdmin || ''), 50);
    doc.text('Responsable del Servicio: ' + (datos.responsableServicio || ''), 50);
    doc.text('Cargo: ' + (datos.cargoServicio || ''), 50);
    
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text('TABLA DE AUTORIZACIONES');
    doc.font('Helvetica').fontSize(9);
    
    if (datos.autorizaciones && datos.autorizaciones.length > 0) {
      datos.autorizaciones.forEach((auth, index) => {
        doc.text((index + 1) + '. Fecha: ' + (auth.fecha || '') + ' | Hora: ' + (auth.horaInicio || '') + ' - ' + (auth.horaTermino || ''));
      });
    }
    
    // PAGINA 2
    doc.addPage();
    doc.fontSize(18).font('Helvetica-Bold').text('PERMISO ESCRITO (PETAR)', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica').text('Lugar: ' + (datos.lugarPETAR || ''), 50);
    doc.text('Fecha: ' + (datos.fechaPETAR || ''), 50);
    doc.text('Hora Inicio: ' + (datos.horaInicioPETAR || ''), 50);
    doc.text('Hora Final: ' + (datos.horaFinalPETAR || ''), 50);
    
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text('DESCRIPCION DEL TRABAJO');
    doc.font('Helvetica').fontSize(10);
    doc.text(datos.descripcionTrabajo || '', 50, doc.y, { width: 500, align: 'left' });
    
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text('TRABAJOS DE ALTO RIESGO');
    doc.font('Helvetica').fontSize(10);
    doc.text((datos.trabajoEspaciosConfinados ? '[X]' : '[ ]') + ' Trabajo en Espacios Confinados');
    doc.text((datos.trabajoTuberias ? '[X]' : '[ ]') + ' Trabajo en Tuberias');
    doc.text((datos.trabajoAltura ? '[X]' : '[ ]') + ' Trabajo en Altura');
    doc.text((datos.trabajoAbierto ? '[X]' : '[ ]') + ' Trabajo Abierto');
    
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').text('EQUIPO DE PROTECCION');
    doc.font('Helvetica').fontSize(10);
    doc.text((datos.proteccionCabeza ? '[X]' : '[ ]') + ' Proteccion para la Cabeza');
    doc.text((datos.proteccionCuerpo ? '[X]' : '[ ]') + ' Proteccion para el Cuerpo');
    doc.text((datos.proteccionOjos ? '[X]' : '[ ]') + ' Proteccion para los Ojos');
    doc.text((datos.proteccionOidos ? '[X]' : '[ ]') + ' Proteccion para los Oidos');
    
    doc.end();

    stream.on('finish', () => {
      res.json({
        success: true,
        message: 'PDF generado correctamente',
        filename: filename,
        downloadUrl: '/descargar/' + filename
      });
    });

    stream.on('error', (err) => {
      res.status(500).json({
        success: false,
        error: err.message
      });
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/descargar/:filename', (req, res) => {
  const filepath = path.join(pdfDir, req.params.filename);
  res.download(filepath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor corriendo en http://localhost:' + PORT);
});
