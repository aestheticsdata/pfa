const dbConnection = require('../../../db/dbinitmysql');
const sharp = require('sharp');
const { access, unlink } = require('fs').promises;
const { constants } = require('fs');
const getImage = require('./helpers/getImage');
const sshCopy = require('../../../helpers/sshRaw').copy;

module.exports = async (req, res, _next) => {
  const {
    path: filepath,
    filename,
  } = req.file;

  sharp.cache(false);

  // check if the file has been written on disk by multer middleware just before
  await access(filepath, constants.F_OK);

  // get image size
  const imageMetadata = await sharp(filepath).metadata();
  const biggerSide = imageMetadata.width > imageMetadata.height ? 'width' : 'height';
  const biggerSideSize = biggerSide === 'width' ? 1125 : 1500;

  // resize file
  const splittedFilename = (filepath).split('.');
  const resizedPathAndFilename = splittedFilename.shift() + '-r.';
  const fileExtension = splittedFilename.pop();
  const outputPath = resizedPathAndFilename + fileExtension;

  await sharp(filepath)
    .resize({
      fit: sharp.fit.contain,
      [biggerSide]: biggerSideSize,
    })
    .toFile(outputPath);

  // delete original file
  await unlink(filepath);

  // save filename to db
  const resizedFilename = filename.slice(0, filename.search(/\./)) + '-r.' + fileExtension;
  if (req.body.itemType === 'spending') {
    if (process.env.NODE_ENV === "production") {
      console.log("outputPath", outputPath);
      const pathSplitted = outputPath.split('/');
      const userID = pathSplitted[4];
      const fileName = pathSplitted[5];
      const dest = `${process.env.PFA_BACKUP_INVOICES_SERVER_PATH}${userID}/${fileName}`;
      console.log("dest", dest);
      sshCopy(outputPath, dest);
      console.log("after sshCopy");
    }
    const sqlSpending = `
      UPDATE Spendings
      SET invoicefile="${resizedFilename}"
      WHERE ID="${req.body.spendingID}"
    `;
    try {
      dbConnection.query(
        sqlSpending,
        async () => {
          const [invoiceImageString, contentType] = await getImage(resizedFilename, req.body.userID);
          res.setHeader('content-type', contentType);
          res.send(invoiceImageString);
        }
      );
    } catch (e) {
      console.log("error updating spending image");
    }
  }
  // if (req.body.itemType === 'recurring') {
    // await prisma.recurrings.updateMany({
    //   where: { label: req.body.label},
    //   data: {
    //     invoicefile: resizedFilename,
    //   },
    // })
  // }
}

