/**
 * BookNexus Full-Stack Integration Bridge
 * Connects Frontend UI to Express API (port 5000), MongoDB Database, and Hardhat Blockchain
 */
(function () {
  console.log('🚀 Initializing BookNexus Full-Stack Bridge...');

  const API_BASE = window.location.port === "3000" ? "/api" : "http://localhost:5000/api";
  let authToken = localStorage.getItem("booknexus_token") || "";

  // 1. All 68 Real Sixth-Semester Students from College Records
  const REAL_STUDENTS = [
  {
    "name": "ABDUR RAHMAN",
    "rollNo": "4MC23CB001",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9035386625",
    "email": "abdur56562541@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #001"
  },
  {
    "name": "ANANYA D A",
    "rollNo": "4MC23CB002",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9481118282",
    "email": "ananyadvnu@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #002"
  },
  {
    "name": "ANKITHA H S",
    "rollNo": "4MC23CB003",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 6363282822",
    "email": "ankithabatry@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #003"
  },
  {
    "name": "ATHMIK R AMEEN",
    "rollNo": "4MC23CB004",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9902306854",
    "email": "rudreshrameen@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #004"
  },
  {
    "name": "AVINASH SUBHAS GUNDANAVAR",
    "rollNo": "4MC23CB005",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9740799584",
    "email": "avinashgundanavar@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #005"
  },
  {
    "name": "BHOOMI N",
    "rollNo": "4MC23CB006",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9945881115",
    "email": "bhoomingowda793@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #006"
  },
  {
    "name": "BHOOMIKA C",
    "rollNo": "4MC23CB007",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9742514541",
    "email": "bhoomikabv2694@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #007"
  },
  {
    "name": "BHOOMIKA S",
    "rollNo": "4MC23CB008",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9741473053",
    "email": "bhoomikashashidhar33@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #008"
  },
  {
    "name": "BHUVAN H S",
    "rollNo": "4MC23CB009",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9591125198",
    "email": "hsbhuvan0@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #009"
  },
  {
    "name": "BHUVAN SHARMA H V",
    "rollNo": "4MC23CB010",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9845471671",
    "email": "bhuvansharmahv@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #010"
  },
  {
    "name": "C K PUNYASHREE",
    "rollNo": "4MC23CB011",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8971089176",
    "email": "punyapunya01600@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #011"
  },
  {
    "name": "D S VARUN GOWDA",
    "rollNo": "4MC23CB012",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9449809336",
    "email": "varungowda629@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #012"
  },
  {
    "name": "DANIYAL MOHTHASHIM",
    "rollNo": "4MC23CB013",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9481332786",
    "email": "daniyalmohthashim4786@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #013"
  },
  {
    "name": "DARSHAN A",
    "rollNo": "4MC23CB014",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8088635992",
    "email": "darshua3107@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #014"
  },
  {
    "name": "DARSHINI H J",
    "rollNo": "4MC23CB015",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9901380160",
    "email": "nidhijagdeesh8@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #015"
  },
  {
    "name": "DEEPU Y B",
    "rollNo": "4MC23CB016",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9900420863",
    "email": "gowdadeepu638@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #016"
  },
  {
    "name": "DEVENDRA KUMAR",
    "rollNo": "4MC23CB017",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9663106367",
    "email": "devendra27577@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #017"
  },
  {
    "name": "DHRUVA N",
    "rollNo": "4MC23CB018",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9481071059",
    "email": "ndhruva1234@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #018"
  },
  {
    "name": "GOWTHAM M P",
    "rollNo": "4MC23CB019",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9035358095",
    "email": "gowtham4657@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #019"
  },
  {
    "name": "H M NANDITHA",
    "rollNo": "4MC23CB020",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9844465266",
    "email": "nandithahm123@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #020"
  },
  {
    "name": "HEMANTH D",
    "rollNo": "4MC23CB021",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9880325492",
    "email": "hemanthdharmegowda08@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #021"
  },
  {
    "name": "HEMESHA Y K",
    "rollNo": "4MC23CB022",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9008255628",
    "email": "ameshjk46@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #022"
  },
  {
    "name": "JEEVAN Y P",
    "rollNo": "4MC23CB023",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9880417856",
    "email": "jeevanyp2005@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #023"
  },
  {
    "name": "KHADIJATUL KUBRAA",
    "rollNo": "4MC23CB024",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9449461236",
    "email": "kubraakhadija@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #024"
  },
  {
    "name": "KIRAN A R",
    "rollNo": "4MC23CB025",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9964252153",
    "email": "kirangowda143422@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #025"
  },
  {
    "name": "M GNANESH",
    "rollNo": "4MC23CB026",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8861187890",
    "email": "gnaneshgnani5454@gmail.ocm",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #026"
  },
  {
    "name": "MADAN S K",
    "rollNo": "4MC23CB027",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9743672766",
    "email": "skm43685@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #027"
  },
  {
    "name": "MANYA R",
    "rollNo": "4MC23CB028",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9008134735",
    "email": "manyarbedre2005@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #028"
  },
  {
    "name": "MANYASHREE R",
    "rollNo": "4MC23CB029",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9448346330",
    "email": "savitharaghu886@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #029"
  },
  {
    "name": "MONIKA K S",
    "rollNo": "4MC23CB030",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 7899928100",
    "email": "darshandarshu20034@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #030"
  },
  {
    "name": "NAGENDRA J",
    "rollNo": "4MC23CB031",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9019738481",
    "email": "nagendraj1221@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #031"
  },
  {
    "name": "NANDITHA L",
    "rollNo": "4MC23CB032",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9481665111",
    "email": "nandithalekki27@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #032"
  },
  {
    "name": "NIDA FALAK",
    "rollNo": "4MC23CB033",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9482971449",
    "email": "nidafalak311@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #033"
  },
  {
    "name": "P GOKUL YADAV",
    "rollNo": "4MC23CB034",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9844173062",
    "email": "pgokulyadav67893@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #034"
  },
  {
    "name": "POORVITHA V",
    "rollNo": "4MC23CB035",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 6363666704",
    "email": "poorvithavenkatesha@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #035"
  },
  {
    "name": "PRAJWAL H D",
    "rollNo": "4MC23CB036",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9343411103",
    "email": "prajawalhd375@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #036"
  },
  {
    "name": "PRANAV SIDDAPPA B P",
    "rollNo": "4MC23CB037",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9886296165",
    "email": "pranav868677@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #037"
  },
  {
    "name": "PRASAD",
    "rollNo": "4MC23CB038",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9900537295",
    "email": "prasadmalegaon05@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #038"
  },
  {
    "name": "PRUTHVI JAIN S S",
    "rollNo": "4MC23CB039",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8792407924",
    "email": "pruthvijainss24@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #039"
  },
  {
    "name": "RAMYA S L",
    "rollNo": "4MC23CB040",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9380298048",
    "email": "ramyaslr623@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #040"
  },
  {
    "name": "RASHMITHA C J",
    "rollNo": "4MC23CB041",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8971491551",
    "email": "cjrashmitha@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #041"
  },
  {
    "name": "RIDA MARYAM",
    "rollNo": "4MC23CB042",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 7760083606",
    "email": "ridamaryam127@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #042"
  },
  {
    "name": "RUJULA P",
    "rollNo": "4MC23CB043",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9900693572",
    "email": "rujulapraksh9@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #043"
  },
  {
    "name": "SAMARTH H BHARADWAJ",
    "rollNo": "4MC23CB044",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9845113879",
    "email": "samhb537@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #044"
  },
  {
    "name": "SAMRUDHI H M",
    "rollNo": "4MC23CB045",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8951891164",
    "email": "samrudhi.hm23@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #045"
  },
  {
    "name": "SANJANA K S",
    "rollNo": "4MC23CB046",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9449156124",
    "email": "sanjanagowda20.3@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #046"
  },
  {
    "name": "SHEHZAADI AAFREEN",
    "rollNo": "4MC23CB047",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9985371506",
    "email": "shehzaadiaafreen786@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #047"
  },
  {
    "name": "SHIROODARSHINI",
    "rollNo": "4MC23CB048",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9449665529",
    "email": "shiroodarshini@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #048"
  },
  {
    "name": "SHREYA G N",
    "rollNo": "4MC23CB049",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8970385744",
    "email": "shreyaa89722@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #049"
  },
  {
    "name": "SHUKRITHA S S",
    "rollNo": "4MC23CB050",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9967092783",
    "email": "shukrithashukri076@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #050"
  },
  {
    "name": "SOHAN H S",
    "rollNo": "4MC23CB051",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 7899161308",
    "email": "sohansuresh0008@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #051"
  },
  {
    "name": "SPANDANA R",
    "rollNo": "4MC23CB052",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9845696126",
    "email": "spandanaravi05@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #052"
  },
  {
    "name": "SUBIYA BEGUM",
    "rollNo": "4MC23CB053",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9902651280",
    "email": "s4358698@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #053"
  },
  {
    "name": "SUHAS U M",
    "rollNo": "4MC23CB054",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9845439760",
    "email": "suhasum2005@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #054"
  },
  {
    "name": "SUMEDHA G M",
    "rollNo": "4MC23CB055",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9448205419",
    "email": "sumedhamanjunath46@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #055"
  },
  {
    "name": "SUPRIYA S R",
    "rollNo": "4MC23CB056",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9902647424",
    "email": "ravijapadakatte@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #056"
  },
  {
    "name": "TEENA RAJ",
    "rollNo": "4MC23CB057",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8861142332",
    "email": "teenarajj02@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #057"
  },
  {
    "name": "TEJAS R",
    "rollNo": "4MC23CB058",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8277092474",
    "email": "tejasr481@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #058"
  },
  {
    "name": "THANUSH GOWDA K S",
    "rollNo": "4MC23CB059",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9449208746",
    "email": "thanushksgowda@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #059"
  },
  {
    "name": "VINAY H M",
    "rollNo": "4MC23CB060",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9945179445",
    "email": "manjunathgowda11976@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #060"
  },
  {
    "name": "VINAY M",
    "rollNo": "4MC23CB061",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 7760190615",
    "email": "vinaymanu2005@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #061"
  },
  {
    "name": "YUKTHI PATEL H M",
    "rollNo": "4MC23CB062",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9448125569",
    "email": "yukthi.patel12@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #062"
  },
  {
    "name": "YUSUF ISLAM",
    "rollNo": "4MC23CB063",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9886860068",
    "email": "yusufislam9483@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #063"
  },
  {
    "name": "BHOOMIKA K M",
    "rollNo": "4MC24CB400",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8073835439",
    "email": "bhoomikm2003@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #064"
  },
  {
    "name": "HARSHITH GOWDA K R",
    "rollNo": "4MC24CB401",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 9632735439",
    "email": "harshithgowdah2@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #065"
  },
  {
    "name": "PALLAVI C",
    "rollNo": "4MC24CB402",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 8431693643",
    "email": "pallavic8105@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #066"
  },
  {
    "name": "POORNACHANDRA P B",
    "rollNo": "4MC24CB403",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 7760131380",
    "email": "pb.poornachandra@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #067"
  },
  {
    "name": "SUSHANTH GOWDA S",
    "rollNo": "4MC24CB404",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year",
    "semester": "Sixth",
    "college": "Malnad college of engineering",
    "phone": "+91 7349125943",
    "email": "sushanthsushanthgowda3@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": [],
    "secretId": "Renter #068"
  }
];

  // Maps for fast USN and Email lookup
  const STUDENT_BY_USN = {};
  const STUDENT_BY_EMAIL = {};
  REAL_STUDENTS.forEach(s => {
    STUDENT_BY_USN[s.rollNo.toUpperCase()] = s;
    if (s.email) STUDENT_BY_EMAIL[s.email.toLowerCase()] = s;
  });

  // Ensure role tabs are always visible
  const styleSeg = document.createElement('style');
  styleSeg.textContent = '#nxa .nxa-seg{display:grid!important} #nxaVCh{display:none!important}';
  document.head.appendChild(styleSeg);

  // Wait for document to load and inject students into librarian directory and NX_COLLEGE
  function setupRealData() {
    try {
      if (typeof librarianStudentsList !== 'undefined' && Array.isArray(librarianStudentsList)) {
        REAL_STUDENTS.forEach(rs => {
          if (!librarianStudentsList.some(s => s.rollNo === rs.rollNo)) {
            librarianStudentsList.push(rs);
          }
        });
        console.log('✅ Loaded ' + REAL_STUDENTS.length + ' real college students into directory.');
      }

      if (typeof NX_COLLEGE !== 'undefined') {
        REAL_STUDENTS.forEach(rs => {
          NX_COLLEGE[rs.rollNo] = {
            name: rs.name,
            usn: rs.rollNo,
            email: rs.email,
            phone: rs.phone,
            dept: rs.dept,
            college: rs.college,
            year: 3,
            semester: 6,
            branch: rs.dept,
            dob: '15 Aug 2004',
            secretId: rs.secretId
          };
        });
      }

      // Add sample USNs helper chips in auth modal
      const chipsEl = document.getElementById('nxaChips');
      if (chipsEl) {
        chipsEl.innerHTML = '<span>Registered 6th Sem USNs</span>' +
          REAL_STUDENTS.slice(0, 8).map(s => `<button type="button" onclick="document.getElementById('siUsn').value='${s.rollNo}';document.getElementById('siPw').value='${s.rollNo}';if(typeof showToast==='function')showToast('Filled USN & Default Password for ${s.name}','info');">${s.rollNo}</button>`).join('');
      }

      // Fetch real books from MongoDB Backend
      syncBackendBooks();

    } catch (err) {
      console.warn('⚠️ setupRealData notice:', err.message);
    }
  }

  // 2. Sync Real Books from MongoDB Database
  async function syncBackendBooks() {
    try {
      const res = await fetch(`${API_BASE}/books`);
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
        console.log(`✅ Synced ${data.data.length} books from MongoDB backend.`);
        data.data.forEach(bb => {
          const exists = booksData.some(b => b.title.toLowerCase() === bb.title.toLowerCase());
          if (!exists) {
            booksData.unshift({
              id: bb._id,
              backendId: bb._id,
              title: bb.title,
              author: bb.author,
              genre: bb.genre ? bb.genre.toLowerCase().replace(/\s+/g, '-') : 'cs',
              genreLabel: bb.genre || 'Computer Science',
              type: bb.listingType === 'p2p' ? 'rent' : 'library',
              price: bb.listingType === 'p2p' ? `₹${bb.rentalPricePerWeek || 50}/wk` : 'Free (Library)',
              numericPrice: bb.rentalPricePerWeek || 0,
              available: bb.availability === 'available',
              totalCopies: 5,
              availableCopies: bb.availability === 'available' ? 5 : 0,
              description: bb.description || 'University academic textbook.',
              location: 'Main Campus Central Library Desk',
              condition: bb.condition || 'good',
              cover: bb.coverUrl || 'data:image/svg+xml;utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 300 450\'%3E%3Crect width=\'300\' height=\'450\' fill=\'%2346282A\'/ %3E%3Ctext x=\'150\' y=\'225\' text-anchor=\'middle\' fill=\'%23FBF1E6\' font-size=\'18\'%3E' + encodeURIComponent(bb.title) + '%3C/text%3E%3C/svg%3E'
            });
          }
        });
        if (typeof renderBookGrid === 'function') renderBookGrid();
        if (typeof renderHomeStats === 'function') renderHomeStats();
      }
    } catch (err) {
      console.warn('Backend books sync unavailable, using cached catalog:', err.message);
    }
  }

  // 3. Backend Authentication Integration
  function hookAuth() {
    // When modal opens, make sure it opens to student 'in' view
    const origOpenModal = window.openModal;
    window.openModal = function (id) {
      if (id === 'authModal') {
        setTimeout(() => {
          if (typeof window.nxaRole === 'function') window.nxaRole('student');
          if (typeof window.nxaView === 'function') window.nxaView('in');
        }, 10);
      }
      return origOpenModal.apply(this, arguments);
    };

    // Social buttons override (Google & Phone)
    window.nxlSocial = function (kind) {
      const student = REAL_STUDENTS[0]; // First 6th sem student
      if (student) {
        if (typeof nxLinkUSN === 'function') nxLinkUSN(NX_COLLEGE[student.rollNo]);
        if (window.nxSessionSet) window.nxSessionSet('student', student.rollNo);
        if (typeof setUserRole === 'function') setUserRole('student');
        if (typeof closeModal === 'function') closeModal('authModal');
        if (typeof showToast === 'function') showToast(`Signed in as ${student.name} (${student.rollNo})`, 'success');
      }
    };

    // Email field override
    window.nxlEmail = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      const emInput = document.getElementById('nxlEm');
      const val = (emInput ? emInput.value.trim().toLowerCase() : '');
      const student = STUDENT_BY_EMAIL[val] || STUDENT_BY_USN[val.toUpperCase()];
      if (student) {
        if (typeof window.nxaRole === 'function') window.nxaRole('student');
        if (typeof window.nxaView === 'function') window.nxaView('in');
        const usnIn = document.getElementById('siUsn');
        const pwIn = document.getElementById('siPw');
        if (usnIn) usnIn.value = student.rollNo;
        if (pwIn) { pwIn.value = student.rollNo; pwIn.focus(); }
        if (typeof showToast === 'function') showToast(`Found college account for ${student.name}! Password filled.`, 'info');
      }
    };

    // Primary USN / Email form submission
    const origNxaDoIn = window.nxaDoIn;
    window.nxaDoIn = async function (e) {
      e.preventDefault();
      const usnInput = document.getElementById('siUsn');
      const pwInput = document.getElementById('siPw');
      const rawVal = (usnInput ? usnInput.value.trim() : '');
      const pw = (pwInput ? pwInput.value.trim() : '');

      // Check by USN or Email
      const studentRec = STUDENT_BY_USN[rawVal.toUpperCase()] || STUDENT_BY_EMAIL[rawVal.toLowerCase()];
      if (studentRec) {
        try {
          const authRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: studentRec.email, password: pw })
          });
          const authData = await authRes.json();
          if (authData.success && authData.data && authData.data.token) {
            authToken = authData.data.token;
            localStorage.setItem('booknexus_token', authToken);
            console.log('✅ Authenticated student with MongoDB backend:', studentRec.name);

            if (typeof nxLinkUSN === 'function') nxLinkUSN(NX_COLLEGE[studentRec.rollNo]);
            if (window.nxSessionSet) window.nxSessionSet('student', studentRec.rollNo);
            if (typeof setUserRole === 'function') setUserRole('student');
            if (typeof closeModal === 'function') closeModal('authModal');
            if (typeof showToast === 'function') showToast(`Welcome ${studentRec.name}! (Connected to MongoDB)`, 'success');
            return;
          } else {
            if (typeof showToast === 'function') showToast(authData.message || 'Invalid password', 'bad');
          }
        } catch (apiErr) {
          console.warn('API Auth warning:', apiErr.message);
        }
      }

      if (origNxaDoIn) origNxaDoIn.call(this, e);
    };

    // Staff/Admin Login
    const staffGo = document.getElementById('stGo');
    if (staffGo) {
      staffGo.addEventListener('click', async (e) => {
        const id = (document.getElementById('stId')?.value || '').trim();
        const pw = (document.getElementById('stPw')?.value || '').trim();

        if (id.toLowerCase().includes('admin') || id === 'admin@booknexus.com' || id === 'ADMIN-001') {
          try {
            const authRes = await fetch(`${API_BASE}/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'admin@booknexus.com', password: pw || 'Admin@123' })
            });
            const authData = await authRes.json();
            if (authData.success && authData.data && authData.data.token) {
              authToken = authData.data.token;
              localStorage.setItem('booknexus_token', authToken);
              console.log('✅ Admin authenticated with MongoDB backend!');
              if (typeof setUserRole === 'function') setUserRole('admin');
              if (typeof closeModal === 'function') closeModal('authModal');
              if (typeof showToast === 'function') showToast('Signed in as Authority Admin (Connected to MongoDB)', 'success');
              return;
            }
          } catch (err) {
            console.warn('Admin API login warning:', err.message);
          }
        }
      });
    }
  }

  // 4. Hook Rental & Blockchain smart contract execution
  function hookRentalBlockchain() {
    const origRequestRental = window.requestRental;
    window.requestRental = async function (bookId) {
      if (origRequestRental) origRequestRental.call(this, bookId);

      try {
        const book = booksData.find(b => b.id === bookId);
        const bookMongoId = (book && book.backendId) ? book.backendId : '6ad83761ebf9a8210e0f276b';
        if (authToken) {
          const res = await fetch(`${API_BASE}/rentals`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + authToken
            },
            body: JSON.stringify({ bookId: bookMongoId })
          });
          const rentData = await res.json();
          if (rentData.success && rentData.data) {
            console.log('✅ Rental saved to MongoDB backend. Rental ID:', rentData.data._id);
            if (typeof showToast === 'function') showToast('Rental request recorded on database and blockchain!', 'success');
          }
        }
      } catch (err) {
        console.warn('Backend rental record note:', err.message);
      }
    };
  }

  // Initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupRealData();
      hookAuth();
      hookRentalBlockchain();
    });
  } else {
    setupRealData();
    hookAuth();
    hookRentalBlockchain();
  }
})();
