var express = require('express');
var router = express.Router();
const verify = require("../middleware/verify")
const connectionModule  = require('../controllers/connection');
const execute = connectionModule.executeQuery;
const { executeAndReturn, executeQuery } = require('../controllers/connection')
const { ngoImageUpload, ngoMemberImageUpload } = require("../controllers/utls")

const fs = require('fs');

router.get('/donors', async function(req, res, next) {
  const ngoMail = req.session.ngoEmail || '12@gmail.com' ;
  console.log(ngoMail)
  const getDonors = `select donor_name, amount, ngo_name from ngo.donor`;
  var ngoName = "";
  await executeAndReturn(getDonors)
  .then((donationData) => {
    console.log(donationData);
    let total = 0;
    donationData.map(async (data) => {
      total += data.amount;
      ngoName = data.ngo_name;
    })
    res.render('./dashboard/admin-donor',{donationData, total, ngoName});
  })
});

router.get('/', /*verify ,*/ (req, res, next) => {
  let query = `select ngo_name from ngo.ngodata where ngo_mail = "${req.session.ngoEmail || "12@gmail.com"}"`;
  // const {isNgoLoggedIn, ngoEmail} = req.session;
  // if(req.session.isNgoLoggedIn) {
      res.render('./dashboard/home-admin.ejs',{})
  // } else {
    // res.redirect('/login')
  // }
});

router.get('/donors', async function(req, res, next) {
  const ngoMail = req.session.ngoEmail || '12@gmail.com' ;
  const getDonors = `select * from ngo.ngo_donor_record where ngo_id = "${ngoMail}" `;
  var ngoName = "";
  await executeAndReturn(getDonors)
  .then((donationData) => {
    let total = 0;
    donationData.map(async (data) => {
      total += data.amount;
      ngoName = data.ngo_name;
    })
    res.render('./dashboard/donor',{donationData, total, ngoName});
  })
});

router.get('/members', async function(req, res, next) {
  let ngoMail = req.session.ngoEmail || "12@gmail.com";
  let query = `select * from ngo.ngo_member where ngo_mail = "${ngoMail}" `;
  await executeAndReturn(query)
  .then((data) => {
    res.render('./dashboard/member',{memberData: data});
  });
});

router.get('/ngorequests', async function(req, res, next) {

  let ngo_req = fs.readFileSync('routes/data_ngo.json');
  
   ngo_req = JSON.parse(ngo_req);
   res.render('./dashboard/ngo-requests',{memberData: ngo_req});
 
});

router.get('/donorrequests', async function(req, res, next) {

  let ngo_req = fs.readFileSync('routes/data_ngo.json');
  
   ngo_req = JSON.parse(ngo_req);
   res.render('./dashboard/donor-requests',{memberData: ngo_req});
 
});

router.post('/ngorequests/reject', async function(req, res, next) {
  
  const {ngo_id} = req.body;

  console.log(ngo_id);

   
   let ngo_data = fs.readFileSync('routes/data_ngo.json');
  
   ngo_data = JSON.parse(ngo_data);
   console.log(ngo_id);
  let ngo_new_data = ngo_data.filter((data)=>{
     return data.ngo_id!==ngo_id
  })
  console.log(ngo_new_data);
  fs.writeFileSync('routes/data_ngo.json', JSON.stringify(ngo_new_data));
  
 
});

router.post('/ngorequests/approve', async function(req, res, next) {
  
  const {ngo_id} = req.body;

  console.log(ngo_id);

   
   let ngo_data = fs.readFileSync('routes/data_ngo.json');
  
   ngo_data = JSON.parse(ngo_data);
   console.log(ngo_id);
   ngo_data.forEach(async(data)=>{
      if(data.ngo_id == ngo_id){
        const sqlQuery = `INSERT INTO ngo.ngodata (ngo_name,ngo_mail,ngo_password,ngo_info,government_id,ngo_address,ngo_bank,ngo_account,ngo_ifsccode, image) VALUES('${data.ngo_name}','${data.ngo_email}','${data.ngo_pass}','${data.ngo_information}','${data.ngo_id}','${data.address}','${data.bank_name}','${data.account_no}','${data.ifsc_code}','test')`;
        await execute(sqlQuery)
        console.log(data);
      }
   })   
   
  

  let ngo_new_data = ngo_data.filter((data)=>{
     return data.ngo_id!==ngo_id
  })

  
  console.log(ngo_new_data);
  fs.writeFileSync('routes/data_ngo.json', JSON.stringify(ngo_new_data));
});


router.get('/ngo-profile', async function(req, res, next) {
  let email = req.session.ngoEmail || "12@gmail.com";
  console.log('Email is ',email);
  let query = `SELECT * FROM ngo.ngodata WHERE ngo_mail = "${email}" `;
  await executeAndReturn(query)
  .then((data) => {
    let ngoInfo = data[0];
    res.render('./dashboard/ngo-profile',{ngoInfo});
  });
});

router.post('/ngo-profile/', ngoImageUpload.single('ngoimage') ,async (req,res)=> {
    console.log(req.file);
    const {ngo_name, govtid, bank_name, acc_no, ifsc_code, info, address, password  } = req.body;
    const email =req.session.ngoEmail || "12@gmail.com";
    let query = `update ngo.ngodata set ngo_name = "${ngo_name}" , government_id = "${govtid}",  ngo_info = "${info}", ngo_ifsccode = "${ifsc_code}", ngo_bank = "${bank_name}", ngo_account = "${acc_no}" ,ngo_password = "${password}" , ngo_address = "${address}" where ngo_mail = "${email}" `
    await executeQuery(query)
    .then(async () => {
      if(req.file) {
        let ngoImage = {
          img: fs.readFileSync(req.file.path),
          file_name: req.file.filename
        };
        var imgQuery = `update ngo.ngodata SET image = "${ngoImage.file_name}" where ngo_mail = "${req.session.ngoEmail || "12@gmail.com"} " `
        await executeQuery(imgQuery)
        .then(() => {
          res.redirect('/dashboard-ngo');
        }) 
    }else {
      res.redirect('/dashboard-ngo');
    }
    })
  })

  router.post('/ngo-profile/delete', async (req, res) => {
    let deleteQuery = `delete from ngo.user where email = "${req.body.ngoEmail}" `;
    await executeQuery(deleteQuery)
    .then(() => {
      res.redirect('/dashboard-ngo');
    })
  })

  router.post('/ngo/delete', async (req, res) => {
    let deleteQuery = `delete from ngo.user where email = "${req.body.ngoEmail}" `;
    await executeQuery(deleteQuery)
    .then(() => {
      res.redirect('/dashboard-ngo');
    })
  })

  router.get('/top-donors', async function(req, res, next) {
      const ngoEmail = req.session.ngoEmail || "12@gmail.com";
      console.log(ngoEmail);
      let getMaxDonors = ` SELECT donor_name , ngo_name, sum(amount) as total_donation from ngo.ngo_donor_record where ngo_id ="${ngoEmail}" group by donor_name order by sum(amount) desc limit 3; `;
      await executeAndReturn(getMaxDonors)
      
      .then((data) => {
        if(data.length!=0){
          console.log(data);
          const ngoName = data[0].ngo_name || "";
          res.render('./dashboard/topdonor',{donorData: data, ngoName});
        }
      })
    });


router.get('/add-member', function(req, res, next) {
  res.render('./dashboard/add-member',{});
});

router.post('/add-member' ,ngoMemberImageUpload.single('member-image'), async (req,res) => {
  const email = req.session.ngoEmail || "12@gmail.com" ;
  if(req.file) {
  var insertMember = `insert into ngo.ngo_member (name, ngo_mail, designation, image) values("${req.body.name}" , "${email}", "${req.body.designation}" ,"${req.file.filename}")`;
  }else {
  var insertMember = `insert into ngo.ngo_member (name, ngo_mail, designation, image) values("${req.body.name}" , "${email}", "${req.body.designation}" ,"null")`;
  }
  await executeQuery(insertMember)
  .then(() =>{
    res.redirect('/dashboard-ngo');
  })
})

module.exports = router;
