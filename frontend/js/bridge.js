/**
 * BookNexus Full-Stack Integration Bridge
 * Connects Frontend UI to Express API (port 5000), MongoDB Database, and Hardhat Blockchain
 */
(function () {
  console.log('🚀 Initializing BookNexus Full-Stack Bridge...');

  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const API_BASE = window.API_BASE || (isLocal ? (window.location.port === "3000" ? "/api" : "http://localhost:5000/api") : "/api");
  let authToken = localStorage.getItem("booknexus_token") || "";

  // All 68 Real Sixth-Semester Students
  const REAL_STUDENTS = [
  {
    "name": "ABDUR RAHMAN",
    "rollNo": "4MC23CB001",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9035386625",
    "email": "abdur56562541@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "ANANYA D A",
    "rollNo": "4MC23CB002",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9481118282",
    "email": "ananyadvnu@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "ANKITHA H S",
    "rollNo": "4MC23CB003",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 6363282822",
    "email": "ankithabatry@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "ATHMIK R AMEEN",
    "rollNo": "4MC23CB004",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9902306854",
    "email": "rudreshrameen@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "AVINASH SUBHAS GUNDANAVAR",
    "rollNo": "4MC23CB005",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9740799584",
    "email": "avinashgundanavar@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "BHOOMI N",
    "rollNo": "4MC23CB006",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9945881115",
    "email": "bhoomingowda793@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "BHOOMIKA C",
    "rollNo": "4MC23CB007",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9742514541",
    "email": "bhoomikabv2694@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "BHOOMIKA S",
    "rollNo": "4MC23CB008",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9741473053",
    "email": "bhoomikashashidhar33@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "BHUVAN H S",
    "rollNo": "4MC23CB009",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9591125198",
    "email": "hsbhuvan0@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "BHUVAN SHARMA H V",
    "rollNo": "4MC23CB010",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9845471671",
    "email": "bhuvansharmahv@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "C K PUNYASHREE",
    "rollNo": "4MC23CB011",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8971089176",
    "email": "punyapunya01600@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "D S VARUN GOWDA",
    "rollNo": "4MC23CB012",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9449809336",
    "email": "varungowda629@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "DANIYAL MOHTHASHIM",
    "rollNo": "4MC23CB013",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9481332786",
    "email": "daniyalmohthashim4786@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "DARSHAN A",
    "rollNo": "4MC23CB014",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8088635992",
    "email": "darshua3107@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "DARSHINI H J",
    "rollNo": "4MC23CB015",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9901380160",
    "email": "nidhijagdeesh8@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "DEEPU Y B",
    "rollNo": "4MC23CB016",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9900420863",
    "email": "gowdadeepu638@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "DEVENDRA KUMAR",
    "rollNo": "4MC23CB017",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9663106367",
    "email": "devendra27577@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "DHRUVA N",
    "rollNo": "4MC23CB018",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9481071059",
    "email": "ndhruva1234@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "GOWTHAM M P",
    "rollNo": "4MC23CB019",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9035358095",
    "email": "gowtham4657@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "H M NANDITHA",
    "rollNo": "4MC23CB020",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9844465266",
    "email": "nandithahm123@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "HEMANTH D",
    "rollNo": "4MC23CB021",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9880325492",
    "email": "hemanthdharmegowda08@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "HEMESHA Y K",
    "rollNo": "4MC23CB022",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9008255628",
    "email": "ameshjk46@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "JEEVAN Y P",
    "rollNo": "4MC23CB023",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9880417856",
    "email": "jeevanyp2005@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "KHADIJATUL KUBRAA",
    "rollNo": "4MC23CB024",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9449461236",
    "email": "kubraakhadija@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "KIRAN A R",
    "rollNo": "4MC23CB025",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9964252153",
    "email": "kirangowda143422@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "M GNANESH",
    "rollNo": "4MC23CB026",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8861187890",
    "email": "gnaneshgnani5454@gmail.ocm",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "MADAN S K",
    "rollNo": "4MC23CB027",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9743672766",
    "email": "skm43685@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "MANYA R",
    "rollNo": "4MC23CB028",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9008134735",
    "email": "manyarbedre2005@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "MANYASHREE R",
    "rollNo": "4MC23CB029",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9448346330",
    "email": "savitharaghu886@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "MONIKA K S",
    "rollNo": "4MC23CB030",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 7899928100",
    "email": "darshandarshu20034@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "NAGENDRA J",
    "rollNo": "4MC23CB031",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9019738481",
    "email": "nagendraj1221@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "NANDITHA L",
    "rollNo": "4MC23CB032",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9481665111",
    "email": "nandithalekki27@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "NIDA FALAK",
    "rollNo": "4MC23CB033",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9482971449",
    "email": "nidafalak311@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "P GOKUL YADAV",
    "rollNo": "4MC23CB034",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9844173062",
    "email": "pgokulyadav67893@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "POORVITHA V",
    "rollNo": "4MC23CB035",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 6363666704",
    "email": "poorvithavenkatesha@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "PRAJWAL H D",
    "rollNo": "4MC23CB036",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9343411103",
    "email": "prajawalhd375@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "PRANAV SIDDAPPA B P",
    "rollNo": "4MC23CB037",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9886296165",
    "email": "pranav868677@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "PRASAD",
    "rollNo": "4MC23CB038",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9900537295",
    "email": "prasadmalegaon05@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "PRUTHVI JAIN S S",
    "rollNo": "4MC23CB039",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8792407924",
    "email": "pruthvijainss24@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "RAMYA S L",
    "rollNo": "4MC23CB040",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9380298048",
    "email": "ramyaslr623@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "RASHMITHA C J",
    "rollNo": "4MC23CB041",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8971491551",
    "email": "cjrashmitha@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "RIDA MARYAM",
    "rollNo": "4MC23CB042",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 7760083606",
    "email": "ridamaryam127@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "RUJULA P",
    "rollNo": "4MC23CB043",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9900693572",
    "email": "rujulapraksh9@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SAMARTH H BHARADWAJ",
    "rollNo": "4MC23CB044",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9845113879",
    "email": "samhb537@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SAMRUDHI H M",
    "rollNo": "4MC23CB045",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8951891164",
    "email": "samrudhi.hm23@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SANJANA K S",
    "rollNo": "4MC23CB046",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9449156124",
    "email": "sanjanagowda20.3@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SHEHZAADI AAFREEN",
    "rollNo": "4MC23CB047",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9985371506",
    "email": "shehzaadiaafreen786@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SHIROODARSHINI",
    "rollNo": "4MC23CB048",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9449665529",
    "email": "shiroodarshini@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SHREYA G N",
    "rollNo": "4MC23CB049",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8970385744",
    "email": "shreyaa89722@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SHUKRITHA S S",
    "rollNo": "4MC23CB050",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9967092783",
    "email": "shukrithashukri076@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SOHAN H S",
    "rollNo": "4MC23CB051",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 7899161308",
    "email": "sohansuresh0008@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SPANDANA R",
    "rollNo": "4MC23CB052",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9845696126",
    "email": "spandanaravi05@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SUBIYA BEGUM",
    "rollNo": "4MC23CB053",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9902651280",
    "email": "s4358698@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SUHAS U M",
    "rollNo": "4MC23CB054",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9845439760",
    "email": "suhasum2005@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SUMEDHA G M",
    "rollNo": "4MC23CB055",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9448205419",
    "email": "sumedhamanjunath46@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SUPRIYA S R",
    "rollNo": "4MC23CB056",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9902647424",
    "email": "ravijapadakatte@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "TEENA RAJ",
    "rollNo": "4MC23CB057",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8861142332",
    "email": "teenarajj02@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "TEJAS R",
    "rollNo": "4MC23CB058",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8277092474",
    "email": "tejasr481@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "THANUSH GOWDA K S",
    "rollNo": "4MC23CB059",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9449208746",
    "email": "thanushksgowda@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "VINAY H M",
    "rollNo": "4MC23CB060",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9945179445",
    "email": "manjunathgowda11976@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "VINAY M",
    "rollNo": "4MC23CB061",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 7760190615",
    "email": "vinaymanu2005@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "YUKTHI PATEL H M",
    "rollNo": "4MC23CB062",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9448125569",
    "email": "yukthi.patel12@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "YUSUF ISLAM",
    "rollNo": "4MC23CB063",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9886860068",
    "email": "yusufislam9483@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "BHOOMIKA K M",
    "rollNo": "4MC24CB400",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8073835439",
    "email": "bhoomikm2003@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "HARSHITH GOWDA K R",
    "rollNo": "4MC24CB401",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 9632735439",
    "email": "harshithgowdah2@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "PALLAVI C",
    "rollNo": "4MC24CB402",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 8431693643",
    "email": "pallavic8105@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "POORNACHANDRA P B",
    "rollNo": "4MC24CB403",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 7760131380",
    "email": "pb.poornachandra@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  },
  {
    "name": "SUSHANTH GOWDA S",
    "rollNo": "4MC24CB404",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "year": "3rd Year (Sem 6)",
    "phone": "+91 7349125943",
    "email": "sushanthsushanthgowda3@gmail.com",
    "borrowedCount": 0,
    "fineBalance": 0,
    "history": []
  }
];
  const COLLEGE_RECORDS = {
  "4MC23CB001": {
    "usn": "4MC23CB001",
    "name": "ABDUR RAHMAN",
    "email": "abdur56562541@gmail.com",
    "phone": "+91 9035386625",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #001",
    "role": "student",
    "imported": true
  },
  "4MC23CB002": {
    "usn": "4MC23CB002",
    "name": "ANANYA D A",
    "email": "ananyadvnu@gmail.com",
    "phone": "+91 9481118282",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #002",
    "role": "student",
    "imported": true
  },
  "4MC23CB003": {
    "usn": "4MC23CB003",
    "name": "ANKITHA H S",
    "email": "ankithabatry@gmail.com",
    "phone": "+91 6363282822",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #003",
    "role": "student",
    "imported": true
  },
  "4MC23CB004": {
    "usn": "4MC23CB004",
    "name": "ATHMIK R AMEEN",
    "email": "rudreshrameen@gmail.com",
    "phone": "+91 9902306854",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #004",
    "role": "student",
    "imported": true
  },
  "4MC23CB005": {
    "usn": "4MC23CB005",
    "name": "AVINASH SUBHAS GUNDANAVAR",
    "email": "avinashgundanavar@gmail.com",
    "phone": "+91 9740799584",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #005",
    "role": "student",
    "imported": true
  },
  "4MC23CB006": {
    "usn": "4MC23CB006",
    "name": "BHOOMI N",
    "email": "bhoomingowda793@gmail.com",
    "phone": "+91 9945881115",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #006",
    "role": "student",
    "imported": true
  },
  "4MC23CB007": {
    "usn": "4MC23CB007",
    "name": "BHOOMIKA C",
    "email": "bhoomikabv2694@gmail.com",
    "phone": "+91 9742514541",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #007",
    "role": "student",
    "imported": true
  },
  "4MC23CB008": {
    "usn": "4MC23CB008",
    "name": "BHOOMIKA S",
    "email": "bhoomikashashidhar33@gmail.com",
    "phone": "+91 9741473053",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #008",
    "role": "student",
    "imported": true
  },
  "4MC23CB009": {
    "usn": "4MC23CB009",
    "name": "BHUVAN H S",
    "email": "hsbhuvan0@gmail.com",
    "phone": "+91 9591125198",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #009",
    "role": "student",
    "imported": true
  },
  "4MC23CB010": {
    "usn": "4MC23CB010",
    "name": "BHUVAN SHARMA H V",
    "email": "bhuvansharmahv@gmail.com",
    "phone": "+91 9845471671",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #010",
    "role": "student",
    "imported": true
  },
  "4MC23CB011": {
    "usn": "4MC23CB011",
    "name": "C K PUNYASHREE",
    "email": "punyapunya01600@gmail.com",
    "phone": "+91 8971089176",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #011",
    "role": "student",
    "imported": true
  },
  "4MC23CB012": {
    "usn": "4MC23CB012",
    "name": "D S VARUN GOWDA",
    "email": "varungowda629@gmail.com",
    "phone": "+91 9449809336",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #012",
    "role": "student",
    "imported": true
  },
  "4MC23CB013": {
    "usn": "4MC23CB013",
    "name": "DANIYAL MOHTHASHIM",
    "email": "daniyalmohthashim4786@gmail.com",
    "phone": "+91 9481332786",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #013",
    "role": "student",
    "imported": true
  },
  "4MC23CB014": {
    "usn": "4MC23CB014",
    "name": "DARSHAN A",
    "email": "darshua3107@gmail.com",
    "phone": "+91 8088635992",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #014",
    "role": "student",
    "imported": true
  },
  "4MC23CB015": {
    "usn": "4MC23CB015",
    "name": "DARSHINI H J",
    "email": "nidhijagdeesh8@gmail.com",
    "phone": "+91 9901380160",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #015",
    "role": "student",
    "imported": true
  },
  "4MC23CB016": {
    "usn": "4MC23CB016",
    "name": "DEEPU Y B",
    "email": "gowdadeepu638@gmail.com",
    "phone": "+91 9900420863",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #016",
    "role": "student",
    "imported": true
  },
  "4MC23CB017": {
    "usn": "4MC23CB017",
    "name": "DEVENDRA KUMAR",
    "email": "devendra27577@gmail.com",
    "phone": "+91 9663106367",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #017",
    "role": "student",
    "imported": true
  },
  "4MC23CB018": {
    "usn": "4MC23CB018",
    "name": "DHRUVA N",
    "email": "ndhruva1234@gmail.com",
    "phone": "+91 9481071059",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #018",
    "role": "student",
    "imported": true
  },
  "4MC23CB019": {
    "usn": "4MC23CB019",
    "name": "GOWTHAM M P",
    "email": "gowtham4657@gmail.com",
    "phone": "+91 9035358095",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #019",
    "role": "student",
    "imported": true
  },
  "4MC23CB020": {
    "usn": "4MC23CB020",
    "name": "H M NANDITHA",
    "email": "nandithahm123@gmail.com",
    "phone": "+91 9844465266",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #020",
    "role": "student",
    "imported": true
  },
  "4MC23CB021": {
    "usn": "4MC23CB021",
    "name": "HEMANTH D",
    "email": "hemanthdharmegowda08@gmail.com",
    "phone": "+91 9880325492",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #021",
    "role": "student",
    "imported": true
  },
  "4MC23CB022": {
    "usn": "4MC23CB022",
    "name": "HEMESHA Y K",
    "email": "ameshjk46@gmail.com",
    "phone": "+91 9008255628",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #022",
    "role": "student",
    "imported": true
  },
  "4MC23CB023": {
    "usn": "4MC23CB023",
    "name": "JEEVAN Y P",
    "email": "jeevanyp2005@gmail.com",
    "phone": "+91 9880417856",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #023",
    "role": "student",
    "imported": true
  },
  "4MC23CB024": {
    "usn": "4MC23CB024",
    "name": "KHADIJATUL KUBRAA",
    "email": "kubraakhadija@gmail.com",
    "phone": "+91 9449461236",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #024",
    "role": "student",
    "imported": true
  },
  "4MC23CB025": {
    "usn": "4MC23CB025",
    "name": "KIRAN A R",
    "email": "kirangowda143422@gmail.com",
    "phone": "+91 9964252153",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #025",
    "role": "student",
    "imported": true
  },
  "4MC23CB026": {
    "usn": "4MC23CB026",
    "name": "M GNANESH",
    "email": "gnaneshgnani5454@gmail.ocm",
    "phone": "+91 8861187890",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #026",
    "role": "student",
    "imported": true
  },
  "4MC23CB027": {
    "usn": "4MC23CB027",
    "name": "MADAN S K",
    "email": "skm43685@gmail.com",
    "phone": "+91 9743672766",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #027",
    "role": "student",
    "imported": true
  },
  "4MC23CB028": {
    "usn": "4MC23CB028",
    "name": "MANYA R",
    "email": "manyarbedre2005@gmail.com",
    "phone": "+91 9008134735",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #028",
    "role": "student",
    "imported": true
  },
  "4MC23CB029": {
    "usn": "4MC23CB029",
    "name": "MANYASHREE R",
    "email": "savitharaghu886@gmail.com",
    "phone": "+91 9448346330",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #029",
    "role": "student",
    "imported": true
  },
  "4MC23CB030": {
    "usn": "4MC23CB030",
    "name": "MONIKA K S",
    "email": "darshandarshu20034@gmail.com",
    "phone": "+91 7899928100",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #030",
    "role": "student",
    "imported": true
  },
  "4MC23CB031": {
    "usn": "4MC23CB031",
    "name": "NAGENDRA J",
    "email": "nagendraj1221@gmail.com",
    "phone": "+91 9019738481",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #031",
    "role": "student",
    "imported": true
  },
  "4MC23CB032": {
    "usn": "4MC23CB032",
    "name": "NANDITHA L",
    "email": "nandithalekki27@gmail.com",
    "phone": "+91 9481665111",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #032",
    "role": "student",
    "imported": true
  },
  "4MC23CB033": {
    "usn": "4MC23CB033",
    "name": "NIDA FALAK",
    "email": "nidafalak311@gmail.com",
    "phone": "+91 9482971449",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #033",
    "role": "student",
    "imported": true
  },
  "4MC23CB034": {
    "usn": "4MC23CB034",
    "name": "P GOKUL YADAV",
    "email": "pgokulyadav67893@gmail.com",
    "phone": "+91 9844173062",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #034",
    "role": "student",
    "imported": true
  },
  "4MC23CB035": {
    "usn": "4MC23CB035",
    "name": "POORVITHA V",
    "email": "poorvithavenkatesha@gmail.com",
    "phone": "+91 6363666704",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #035",
    "role": "student",
    "imported": true
  },
  "4MC23CB036": {
    "usn": "4MC23CB036",
    "name": "PRAJWAL H D",
    "email": "prajawalhd375@gmail.com",
    "phone": "+91 9343411103",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #036",
    "role": "student",
    "imported": true
  },
  "4MC23CB037": {
    "usn": "4MC23CB037",
    "name": "PRANAV SIDDAPPA B P",
    "email": "pranav868677@gmail.com",
    "phone": "+91 9886296165",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #037",
    "role": "student",
    "imported": true
  },
  "4MC23CB038": {
    "usn": "4MC23CB038",
    "name": "PRASAD",
    "email": "prasadmalegaon05@gmail.com",
    "phone": "+91 9900537295",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #038",
    "role": "student",
    "imported": true
  },
  "4MC23CB039": {
    "usn": "4MC23CB039",
    "name": "PRUTHVI JAIN S S",
    "email": "pruthvijainss24@gmail.com",
    "phone": "+91 8792407924",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #039",
    "role": "student",
    "imported": true
  },
  "4MC23CB040": {
    "usn": "4MC23CB040",
    "name": "RAMYA S L",
    "email": "ramyaslr623@gmail.com",
    "phone": "+91 9380298048",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #040",
    "role": "student",
    "imported": true
  },
  "4MC23CB041": {
    "usn": "4MC23CB041",
    "name": "RASHMITHA C J",
    "email": "cjrashmitha@gmail.com",
    "phone": "+91 8971491551",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #041",
    "role": "student",
    "imported": true
  },
  "4MC23CB042": {
    "usn": "4MC23CB042",
    "name": "RIDA MARYAM",
    "email": "ridamaryam127@gmail.com",
    "phone": "+91 7760083606",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #042",
    "role": "student",
    "imported": true
  },
  "4MC23CB043": {
    "usn": "4MC23CB043",
    "name": "RUJULA P",
    "email": "rujulapraksh9@gmail.com",
    "phone": "+91 9900693572",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #043",
    "role": "student",
    "imported": true
  },
  "4MC23CB044": {
    "usn": "4MC23CB044",
    "name": "SAMARTH H BHARADWAJ",
    "email": "samhb537@gmail.com",
    "phone": "+91 9845113879",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #044",
    "role": "student",
    "imported": true
  },
  "4MC23CB045": {
    "usn": "4MC23CB045",
    "name": "SAMRUDHI H M",
    "email": "samrudhi.hm23@gmail.com",
    "phone": "+91 8951891164",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #045",
    "role": "student",
    "imported": true
  },
  "4MC23CB046": {
    "usn": "4MC23CB046",
    "name": "SANJANA K S",
    "email": "sanjanagowda20.3@gmail.com",
    "phone": "+91 9449156124",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #046",
    "role": "student",
    "imported": true
  },
  "4MC23CB047": {
    "usn": "4MC23CB047",
    "name": "SHEHZAADI AAFREEN",
    "email": "shehzaadiaafreen786@gmail.com",
    "phone": "+91 9985371506",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #047",
    "role": "student",
    "imported": true
  },
  "4MC23CB048": {
    "usn": "4MC23CB048",
    "name": "SHIROODARSHINI",
    "email": "shiroodarshini@gmail.com",
    "phone": "+91 9449665529",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #048",
    "role": "student",
    "imported": true
  },
  "4MC23CB049": {
    "usn": "4MC23CB049",
    "name": "SHREYA G N",
    "email": "shreyaa89722@gmail.com",
    "phone": "+91 8970385744",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #049",
    "role": "student",
    "imported": true
  },
  "4MC23CB050": {
    "usn": "4MC23CB050",
    "name": "SHUKRITHA S S",
    "email": "shukrithashukri076@gmail.com",
    "phone": "+91 9967092783",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #050",
    "role": "student",
    "imported": true
  },
  "4MC23CB051": {
    "usn": "4MC23CB051",
    "name": "SOHAN H S",
    "email": "sohansuresh0008@gmail.com",
    "phone": "+91 7899161308",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #051",
    "role": "student",
    "imported": true
  },
  "4MC23CB052": {
    "usn": "4MC23CB052",
    "name": "SPANDANA R",
    "email": "spandanaravi05@gmail.com",
    "phone": "+91 9845696126",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #052",
    "role": "student",
    "imported": true
  },
  "4MC23CB053": {
    "usn": "4MC23CB053",
    "name": "SUBIYA BEGUM",
    "email": "s4358698@gmail.com",
    "phone": "+91 9902651280",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #053",
    "role": "student",
    "imported": true
  },
  "4MC23CB054": {
    "usn": "4MC23CB054",
    "name": "SUHAS U M",
    "email": "suhasum2005@gmail.com",
    "phone": "+91 9845439760",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #054",
    "role": "student",
    "imported": true
  },
  "4MC23CB055": {
    "usn": "4MC23CB055",
    "name": "SUMEDHA G M",
    "email": "sumedhamanjunath46@gmail.com",
    "phone": "+91 9448205419",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #055",
    "role": "student",
    "imported": true
  },
  "4MC23CB056": {
    "usn": "4MC23CB056",
    "name": "SUPRIYA S R",
    "email": "ravijapadakatte@gmail.com",
    "phone": "+91 9902647424",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #056",
    "role": "student",
    "imported": true
  },
  "4MC23CB057": {
    "usn": "4MC23CB057",
    "name": "TEENA RAJ",
    "email": "teenarajj02@gmail.com",
    "phone": "+91 8861142332",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #057",
    "role": "student",
    "imported": true
  },
  "4MC23CB058": {
    "usn": "4MC23CB058",
    "name": "TEJAS R",
    "email": "tejasr481@gmail.com",
    "phone": "+91 8277092474",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #058",
    "role": "student",
    "imported": true
  },
  "4MC23CB059": {
    "usn": "4MC23CB059",
    "name": "THANUSH GOWDA K S",
    "email": "thanushksgowda@gmail.com",
    "phone": "+91 9449208746",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #059",
    "role": "student",
    "imported": true
  },
  "4MC23CB060": {
    "usn": "4MC23CB060",
    "name": "VINAY H M",
    "email": "manjunathgowda11976@gmail.com",
    "phone": "+91 9945179445",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #060",
    "role": "student",
    "imported": true
  },
  "4MC23CB061": {
    "usn": "4MC23CB061",
    "name": "VINAY M",
    "email": "vinaymanu2005@gmail.com",
    "phone": "+91 7760190615",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #061",
    "role": "student",
    "imported": true
  },
  "4MC23CB062": {
    "usn": "4MC23CB062",
    "name": "YUKTHI PATEL H M",
    "email": "yukthi.patel12@gmail.com",
    "phone": "+91 9448125569",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #062",
    "role": "student",
    "imported": true
  },
  "4MC23CB063": {
    "usn": "4MC23CB063",
    "name": "YUSUF ISLAM",
    "email": "yusufislam9483@gmail.com",
    "phone": "+91 9886860068",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #063",
    "role": "student",
    "imported": true
  },
  "4MC24CB400": {
    "usn": "4MC24CB400",
    "name": "BHOOMIKA K M",
    "email": "bhoomikm2003@gmail.com",
    "phone": "+91 8073835439",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #064",
    "role": "student",
    "imported": true
  },
  "4MC24CB401": {
    "usn": "4MC24CB401",
    "name": "HARSHITH GOWDA K R",
    "email": "harshithgowdah2@gmail.com",
    "phone": "+91 9632735439",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #065",
    "role": "student",
    "imported": true
  },
  "4MC24CB402": {
    "usn": "4MC24CB402",
    "name": "PALLAVI C",
    "email": "pallavic8105@gmail.com",
    "phone": "+91 8431693643",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #066",
    "role": "student",
    "imported": true
  },
  "4MC24CB403": {
    "usn": "4MC24CB403",
    "name": "POORNACHANDRA P B",
    "email": "pb.poornachandra@gmail.com",
    "phone": "+91 7760131380",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #067",
    "role": "student",
    "imported": true
  },
  "4MC24CB404": {
    "usn": "4MC24CB404",
    "name": "SUSHANTH GOWDA S",
    "email": "sushanthsushanthgowda3@gmail.com",
    "phone": "+91 7349125943",
    "dept": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "branch": "COMPUTER SCIENCE AND BUSINESS SYSTEMS",
    "college": "Malnad college of engineering",
    "year": 3,
    "semester": 6,
    "dob": "15 Aug 2004",
    "secretId": "Renter #068",
    "role": "student",
    "imported": true
  }
};

  const STUDENT_BY_USN = {};
  const STUDENT_BY_EMAIL = {};
  REAL_STUDENTS.forEach(s => {
    STUDENT_BY_USN[s.rollNo.toUpperCase()] = s;
    if (s.email) STUDENT_BY_EMAIL[s.email.toLowerCase()] = s;
  });


  // Preload into Admin Desk College Records
  const collegeDbPayload = {
    files: [{
      id: "f_sixth_sem_excel",
      name: "Sixth Semester students - booknexus.xlsx",
      kind: "student",
      kindLabel: "Students",
      at: Date.now(),
      records: COLLEGE_RECORDS
    }]
  };
  try {
    localStorage.setItem('bnx_college_db_v1', JSON.stringify(collegeDbPayload));
  } catch (e) {}

  window.REAL_STUDENTS = REAL_STUDENTS;
  window.COLLEGE_RECORDS = COLLEGE_RECORDS;
  window.API_BASE = API_BASE;

  function setupRealData() {
    try {
      if (typeof librarianStudentsList !== 'undefined' && Array.isArray(librarianStudentsList)) {
        // Prepend our real 68 students
        REAL_STUDENTS.forEach(rs => {
          if (!librarianStudentsList.some(s => s.rollNo === rs.rollNo)) {
            librarianStudentsList.push(rs);
          }
        });
        console.log('✅ Loaded ' + REAL_STUDENTS.length + ' real college students into directory.');
      }

      if (typeof NX_COLLEGE !== 'undefined') {
        Object.assign(NX_COLLEGE, COLLEGE_RECORDS);
      }

      // Production auth modal: clean interface without demo chips
      const chipsEl = document.getElementById('nxaChips');
      if (chipsEl) {
        chipsEl.innerHTML = '';
        chipsEl.style.display = 'none';
      }

      // Live USN input listeners: clear any missing errors
      ['nxlUsn', 'siUsn', 'suUsn', 'fpUsn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', () => {
            const errEl = document.getElementById(id + 'E');
            if (errEl) { errEl.hidden = true; errEl.textContent = ''; }
            el.removeAttribute('aria-invalid');
          });
        }
      });

      syncBackendBooks();
    } catch (err) {
      console.warn('⚠️ setupRealData notice:', err.message);
    }
  }

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

  function hookAuth() {
    // Populate local auth database with all 68 students and their links
    try {
      const KEY = 'bnx_auth_v1';
      let d = {};
      try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { d = {}; }
      d.students = d.students || {};
      d.staff = d.staff || {};
      d.links = d.links || {};
      d.fails = d.fails || {};

      // Seed admin and librarian staff credentials if missing
      if (!d.staff['ADMIN-001']) {
        d.staff['ADMIN-001'] = {
          role: "admin",
          name: "Library Administrator",
          email: "admin@booknexus.com",
          salt: "pxFNEOQw3j2rlz6Ovkh+yg==",
          hash: "q/64yWDpBjYzc9VNbPYlwPnmdVof1C094M6gm5TWxws=",
          iter: 150000
        };
      }
      d.links['admin@booknexus.com'] = 'ADMIN-001';

      REAL_STUDENTS.forEach(s => {
        const cleanEm = s.email.toLowerCase();
        const cleanPhone = s.phone.replace(/\D/g, '').slice(-10);
        d.links[cleanEm] = s.rollNo;
        if (cleanPhone) d.links['tel:' + cleanPhone] = s.rollNo;
        if (!d.students[s.rollNo]) {
          d.students[s.rollNo] = {
            name: s.name,
            email: s.email,
            loginEmail: s.email,
            phone: s.phone,
            rollNo: s.rollNo,
            usn: s.rollNo,
            plainPassword: s.rollNo,
            salt: "pxFNEOQw3j2rlz6Ovkh+yg==",
            hash: "q/64yWDpBjYzc9VNbPYlwPnmdVof1C094M6gm5TWxws=",
            iter: 150000,
            createdAt: Date.now()
          };
        }
      });
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch (e) {
      console.warn('Could not seed bnx_auth_v1:', e.message);
    }

    const origOpenModal = window.openModal;
    window.openModal = function (id) {
      const res = origOpenModal ? origOpenModal.apply(this, arguments) : undefined;
      if (id === 'authModal' && !window.__openingCreateAccount) {
        setTimeout(() => {
          if (!window.__openingCreateAccount && typeof window.nxaView === 'function') {
            window.nxaView('ch');
          }
        }, 10);
      }
      return res;
    };

    window.openCreateAccount = function (email) {
      window.__openingCreateAccount = true;
      if (typeof origOpenModal === 'function') origOpenModal('authModal');
      else if (typeof window.openModal === 'function') window.openModal('authModal');
      setTimeout(() => {
        const em = email || '';
        const nwEm = document.getElementById('nxlNwEm');
        if (nwEm) {
          nwEm.textContent = em;
          if (nwEm.parentElement) nwEm.parentElement.hidden = !em;
        }

        const emInput = document.getElementById('nxlEmail');
        if (emInput && em) {
          emInput.value = em;
        }

        const rpBar = document.getElementById('nxaRp');
        if (rpBar) rpBar.hidden = true;

        const nxa = document.getElementById('nxa');
        if (nxa) nxa.classList.add('nx-roles');

        ['nxaVCh', 'nxaVPw', 'nxaVPh', 'nxaVIn', 'nxaVUp', 'nxaVFp', 'nxaVGg'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.hidden = true;
        });
        const nForm = document.getElementById('nxaVNew');
        if (nForm) nForm.hidden = false;

        const h = document.querySelector('#authModal h3');
        if (h) h.textContent = 'Create Student Account';
        const sub = document.getElementById('nxaSub');
        if (sub) sub.textContent = 'Please enter your student details and official USN to continue.';

        // Blank out details (except email if provided) so user starts clean
        ['nxlName', 'nxlUsn', 'nxlDob', 'nxlNp', 'nxlNp2', 'nxlNick', 'nxlBio'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.value = '';
        });

        if (typeof window.nwShow === 'function') window.nwShow(1, true);

        const nameField = document.getElementById('nxlName');
        if (nameField) nameField.focus();

        setTimeout(() => { window.__openingCreateAccount = false; }, 200);
      }, 50);
    };

    // Unified Google Sign-In caller delegating to central handler
    function openGoogleSignIn() {
      if (typeof window.startGoogleOAuth === 'function') {
        window.startGoogleOAuth();
      }
    }
    window.openGoogleSignIn = openGoogleSignIn;

    window.nxlSocial = function (kind) {
      if (kind === 'google') {
        openGoogleSignIn();
      } else if (kind === 'phone') {
        if (typeof phReset === 'function') phReset();
        if (typeof window.nxaView === 'function') window.nxaView('ph');
      }
    };

    // Background sync to backend when signed in
    const origFinishStudent = window.finishStudent;
    if (typeof origFinishStudent === 'function') {
      window.finishStudent = function (rec) {
        if (rec) {
          try {
            currentUser = {
              name: rec.name,
              rollNo: rec.usn,
              email: rec.email,
              dept: rec.dept || '',
              year: rec.year || '',
              phone: rec.phone || '',
              anonId: rec.secretId || ('ID-' + (rec.usn || '').slice(-3))
            };
          } catch (e) {}
        }
        if (rec && rec.token) {
          authToken = rec.token;
          localStorage.setItem('booknexus_token', authToken);
          return origFinishStudent.apply(this, arguments);
        }
        if (rec && (rec.usn || rec.email)) {
          fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: rec.usn || rec.email, password: rec.usn || 'student123' })
          }).then(r => r.json()).then(data => {
            if (data && data.success && data.data && data.data.token) {
              authToken = data.data.token;
              localStorage.setItem('booknexus_token', authToken);
              console.log('✅ Student synced with backend API! Token saved.');
            }
          }).catch((err) => {
            console.warn('API sync notice:', err.message);
          });
        }
        return origFinishStudent.apply(this, arguments);
      };
    }

    // -------------------------------------------------------------
    // BookNexus Complete Auth & Interactive Onboarding Quiz System
    // -------------------------------------------------------------
    const NX_QUIZ_QUESTIONS = [
      {
        id: 0,
        q: "What pulls you into a book?",
        opts: [
          { key: "a", text: "A story to get lost in" },
          { key: "b", text: "Something real that happened" },
          { key: "c", text: "How things work & tech logic" },
          { key: "d", text: "Ideas that change how I think" },
          { key: "e", text: "Ways to improve my life & habits" },
          { key: "f", text: "Clear explanations for my course" }
        ]
      },
      {
        id: 1,
        q: "It's midnight and the library is yours. Where do you wander?",
        opts: [
          { key: "a", text: "Fantasy, novels and classics" },
          { key: "b", text: "Old maps, history & dusty archives" },
          { key: "c", text: "Circuit boards and lab manuals" },
          { key: "d", text: "A quiet corner with big questions" },
          { key: "e", text: "A study desk piled with course notes" },
          { key: "f", text: "The self-growth & mindset shelf" }
        ]
      },
      {
        id: 2,
        q: "Which subjects do you enjoy most?",
        opts: [
          { key: "a", text: "Numbers, algorithms and logic" },
          { key: "b", text: "Machines and building physical things" },
          { key: "c", text: "The past, biographies & its people" },
          { key: "d", text: "Life, consciousness & the universe" },
          { key: "e", text: "Language, fiction & storytelling" },
          { key: "f", text: "The human mind & productivity" }
        ]
      },
      {
        id: 3,
        q: "Who would you invite to dinner?",
        opts: [
          { key: "a", text: "A scientist who just made a breakthrough" },
          { key: "b", text: "A historian with captivating stories" },
          { key: "c", text: "A philosopher who loves rigorous debate" },
          { key: "d", text: "A visionary founder who built an empire" },
          { key: "e", text: "An engineer with a toolbox of inventions" },
          { key: "f", text: "A novelist with an unexpected plot twist" }
        ]
      },
      {
        id: 4,
        q: "A free rainy afternoon. What are you doing?",
        opts: [
          { key: "a", text: "Curled up with an immersive fiction novel" },
          { key: "b", text: "Exploring a deep documentary and researching" },
          { key: "c", text: "Writing code or solving logic puzzles" },
          { key: "d", text: "Reflecting, journaling and strategic planning" },
          { key: "e", text: "Taking something apart to see how it works" },
          { key: "f", text: "Reading a biography of someone inspirational" }
        ]
      },
      {
        id: 5,
        q: "What do you usually read for?",
        opts: [
          { key: "a", text: "College exams and core textbooks" },
          { key: "b", text: "Practical engineering & tech skills" },
          { key: "c", text: "Personal growth & career leadership" },
          { key: "d", text: "Escape, recreation & imagination" },
          { key: "e", text: "Curiosity across science and humanity" }
        ]
      }
    ];

    window.__suQuizAnswers = {};
    window.__obQuizAnswers = {};

    function renderInteractiveQuiz(containerId, progressId, errorId, answerStore) {
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = '';

      NX_QUIZ_QUESTIONS.forEach((qItem, idx) => {
        const qBox = document.createElement('div');
        qBox.className = 'p-3 bg-brand-ivory/90 dark:bg-brand-darkSurface/90 rounded-2xl border border-brand-rosewood/15 text-left';
        
        const qTitle = document.createElement('div');
        qTitle.className = 'text-xs font-bold text-brand-rosewood dark:text-white mb-2 flex items-center justify-between';
        qTitle.innerHTML = `<span><strong class="text-brand-gold">Q${idx + 1}.</strong> ${qItem.q}</span><span id="${containerId}_check_${idx}" class="text-[10px] text-gray-400">${answerStore[idx] ? '✓ Selected' : 'Required'}</span>`;
        qBox.appendChild(qTitle);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2';

        qItem.opts.forEach(opt => {
          const btn = document.createElement('button');
          btn.type = 'button';
          const isSelected = answerStore[idx] === opt.key;
          btn.className = `p-2 rounded-xl text-xs text-left transition-all border flex items-center gap-2 ${
            isSelected
              ? 'border-brand-rosewood bg-brand-rosewood/15 text-brand-rosewood font-bold shadow-sm'
              : 'border-brand-rosewood/10 hover:border-brand-rosewood/30 bg-white/70 text-gray-700'
          }`;
          btn.innerHTML = `<span class="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 ${isSelected ? 'bg-brand-rosewood text-white' : ''}">${opt.key.toUpperCase()}</span><span class="truncate">${opt.text}</span>`;
          btn.onclick = () => {
            answerStore[idx] = opt.key;
            const errEl = document.getElementById(errorId);
            if (errEl) errEl.hidden = true;
            renderInteractiveQuiz(containerId, progressId, errorId, answerStore);
          };
          grid.appendChild(btn);
        });

        qBox.appendChild(grid);
        container.appendChild(qBox);
      });

      // Update progress
      const answeredCount = Object.keys(answerStore).length;
      const progEl = document.getElementById(progressId);
      if (progEl) {
        progEl.textContent = answeredCount === 6 ? '6/6 answered ✓' : `${answeredCount}/6 answered`;
        progEl.className = answeredCount === 6 ? 'text-[11px] font-bold text-green-700' : 'text-[11px] font-medium text-brand-rosewood/80';
      }
    }

    window.ensureSuQuizRendered = function () {
      renderInteractiveQuiz('suQuizContainer', 'suQuizProgress', 'suQuizE', window.__suQuizAnswers);
    };

    window.ensureObQuizRendered = function () {
      renderInteractiveQuiz('obQuizContainer', 'obQuizProgress', 'obQuizE', window.__obQuizAnswers);
    };

    // Direct student USN login hook connected to MongoDB Backend
    window.nxaDoIn = async function (e) {
      if (e && e.preventDefault) e.preventDefault();
      const usnInput = document.getElementById('siUsn');
      const pwInput = document.getElementById('siPw');
      const btn = document.getElementById('siGo');
      const banner = document.getElementById('nxaBanner');
      const errEl = document.getElementById('siPwE');

      if (errEl) errEl.hidden = true;
      if (banner) { banner.hidden = true; banner.textContent = ''; }

      const usn = (usnInput ? usnInput.value : '').trim().toUpperCase();
      const pw = pwInput ? pwInput.value : '';

      if (!usn) {
        if (errEl) { errEl.textContent = 'Please enter your student USN.'; errEl.hidden = false; }
        return;
      }
      if (!pw) {
        if (errEl) { errEl.textContent = 'Please enter your password.'; errEl.hidden = false; }
        return;
      }

      const origText = btn ? btn.textContent : 'Sign in';
      if (btn) { btn.disabled = true; btn.textContent = 'Authenticating…'; }

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: usn, password: pw })
        });
        const json = await res.json();

        if (json.success && json.data) {
          const studentData = json.data;
          authToken = studentData.token;
          localStorage.setItem('booknexus_token', authToken);
          localStorage.setItem('bookhive_token', authToken);
          localStorage.setItem('currentUser', JSON.stringify(studentData));
          localStorage.setItem('bookhive_user', JSON.stringify(studentData));
          sessionStorage.setItem('booknexus_token', authToken);
          sessionStorage.setItem('currentUser', JSON.stringify(studentData));
          window.currentUser = studentData;
          window.currentRole = 'student';

          if (pwInput) pwInput.value = '';
          if (typeof closeModal === 'function') closeModal('authModal');
          if (typeof origFinishStudent === 'function') origFinishStudent(studentData);
          if (typeof window.nxSessionSet === 'function') window.nxSessionSet('student', studentData.usn || studentData._id, studentData.name, studentData.email);
          if (typeof showToast === 'function') showToast(`Welcome back, ${studentData.name || studentData.usn}!`, 'success');
          if (typeof updateNavProfile === 'function') updateNavProfile();
          if (typeof switchNav === 'function') switchNav('dashboard');
          if (typeof window.fetchLiveRentalsAndSync === 'function') window.fetchLiveRentalsAndSync();
          if (typeof window.fetchLiveTransactions === 'function') window.fetchLiveTransactions();
          return;
        } else if (json.needsOnboarding) {
          // Incomplete student account -> redirect to complete onboarding
          window.__onboardingToken = json.data?.token || '';
          if (document.getElementById('obUsn')) document.getElementById('obUsn').value = usn;
          if (typeof window.nxaView === 'function') window.nxaView('onboard');
          if (typeof showToast === 'function') showToast('Please complete student onboarding and reading quiz.', 'info');
          return;
        } else {
          if (errEl) {
            errEl.textContent = json.message || 'Invalid USN or password.';
            errEl.hidden = false;
          }
          if (banner) {
            banner.className = 'nxa-banner bad';
            banner.textContent = json.message || 'Invalid USN or password.';
            banner.hidden = false;
          }
        }
      } catch (netErr) {
        console.error('USN Login API error:', netErr);
        if (errEl) {
          errEl.textContent = 'Server connection error. Please try again.';
          errEl.hidden = false;
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = origText; }
      }
    };

    // New Student Registration Submission Hook
    window.nxaDoUp = async function (e) {
      if (e && e.preventDefault) e.preventDefault();
      const banner = document.getElementById('nxaBanner');
      const quizErr = document.getElementById('suQuizE');
      const btn = document.getElementById('suGo');
      if (banner) { banner.hidden = true; banner.textContent = ''; }
      if (quizErr) quizErr.hidden = true;

      const name = (document.getElementById('suName')?.value || '').trim();
      const usn = (document.getElementById('suUsn')?.value || '').trim().toUpperCase();
      const dob = (document.getElementById('suDob')?.value || '').trim();
      const email = (document.getElementById('suEmail')?.value || '').trim().toLowerCase();
      const phone = (document.getElementById('suPhone')?.value || '').trim();
      const dept = document.getElementById('suDept')?.value || 'Computer Science and Business Systems';
      const sem = document.getElementById('suSem')?.value || 'Semester 6';
      const pw = document.getElementById('suPw')?.value || '';
      const pw2 = document.getElementById('suPw2')?.value || '';

      if (!name || !usn || !email || !dob || !pw || !pw2) {
        if (banner) {
          banner.className = 'nxa-banner bad';
          banner.textContent = 'Please fill in all required fields (Name, USN, DOB, Email, Password).';
          banner.hidden = false;
        }
        return;
      }

      if (pw !== pw2) {
        if (banner) {
          banner.className = 'nxa-banner bad';
          banner.textContent = 'Passwords do not match.';
          banner.hidden = false;
        }
        return;
      }

      if (pw.length < 6) {
        if (banner) {
          banner.className = 'nxa-banner bad';
          banner.textContent = 'Password must be at least 6 characters long.';
          banner.hidden = false;
        }
        return;
      }

      const answeredKeys = Object.keys(window.__suQuizAnswers || {});
      if (answeredKeys.length < 6) {
        if (quizErr) {
          quizErr.textContent = `Please answer all 6 quiz questions to calculate your personalized recommendations (${answeredKeys.length}/6 completed).`;
          quizErr.hidden = false;
        }
        return;
      }

      const origText = btn ? btn.textContent : 'Create Account';
      if (btn) { btn.disabled = true; btn.textContent = 'Creating Account & Preferences…'; }

      try {
        const payload = {
          name,
          usn,
          dob,
          email,
          phone: phone || '',
          branch: 'Computer Science and Business Systems',
          department: dept || 'Computer Science and Business Systems',
          college: 'Malnad college of engineering',
          semester: sem || 'Semester 6',
          password: pw,
          confirmPassword: pw2,
          quizAnswers: window.__suQuizAnswers
        };

        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.success && json.data) {
          const studentData = json.data.user || json.data;
          authToken = json.data.token || '';
          localStorage.setItem('booknexus_token', authToken);
          localStorage.setItem('bookhive_token', authToken);
          localStorage.setItem('currentUser', JSON.stringify(studentData));
          sessionStorage.setItem('booknexus_token', authToken);
          sessionStorage.setItem('currentUser', JSON.stringify(studentData));
          window.currentUser = studentData;
          window.currentRole = 'student';

          if (typeof closeModal === 'function') closeModal('authModal');
          if (typeof origFinishStudent === 'function') origFinishStudent(studentData);
          if (typeof window.nxSessionSet === 'function') window.nxSessionSet('student', studentData.usn || studentData._id, studentData.name, studentData.email);
          if (typeof showToast === 'function') showToast(`Account created! Welcome to BookNexus, ${studentData.name}!`, 'success');
          if (typeof updateNavProfile === 'function') updateNavProfile();
          if (typeof switchNav === 'function') switchNav('dashboard');
          if (typeof window.fetchLiveRentalsAndSync === 'function') window.fetchLiveRentalsAndSync();
          if (typeof window.fetchLiveTransactions === 'function') window.fetchLiveTransactions();
          return;
        } else {
          if (banner) {
            banner.className = 'nxa-banner bad';
            banner.textContent = json.message || 'Registration failed. Please check your details.';
            banner.hidden = false;
          }
        }
      } catch (apiErr) {
        console.error('Registration API error:', apiErr);
        if (banner) {
          banner.className = 'nxa-banner bad';
          banner.textContent = 'Network error while registering. Please try again.';
          banner.hidden = false;
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = origText; }
      }
    };

    // Google Student Onboarding Completion Hook
    window.nxaDoOnboard = async function (e) {
      if (e && e.preventDefault) e.preventDefault();
      const banner = document.getElementById('nxaBanner');
      const quizErr = document.getElementById('obQuizE');
      const btn = document.getElementById('obGo');
      if (banner) { banner.hidden = true; banner.textContent = ''; }
      if (quizErr) quizErr.hidden = true;

      const usn = (document.getElementById('obUsn')?.value || '').trim().toUpperCase();
      const dob = (document.getElementById('obDob')?.value || '').trim();
      const phone = (document.getElementById('obPhone')?.value || '').trim();
      const dept = document.getElementById('obDept')?.value || 'Computer Science and Business Systems';
      const sem = document.getElementById('obSem')?.value || 'Semester 6';

      if (!usn || !dob) {
        if (banner) {
          banner.className = 'nxa-banner bad';
          banner.textContent = 'Please enter your student USN and select your Date of Birth.';
          banner.hidden = false;
        }
        return;
      }

      const answeredKeys = Object.keys(window.__obQuizAnswers || {});
      if (answeredKeys.length < 6) {
        if (quizErr) {
          quizErr.textContent = `Please answer all 6 quiz questions to discover your personalized book recommendations (${answeredKeys.length}/6 completed).`;
          quizErr.hidden = false;
        }
        return;
      }

      const token = window.__onboardingToken || localStorage.getItem('booknexus_onboarding_token') || authToken;
      if (!token) {
        if (banner) {
          banner.className = 'nxa-banner bad';
          banner.textContent = 'Session expired. Please sign in with Google again.';
          banner.hidden = false;
        }
        return;
      }

      const origText = btn ? btn.textContent : 'Complete Profile';
      if (btn) { btn.disabled = true; btn.textContent = 'Saving Profile & Calculating Genres…'; }

      try {
        const payload = {
          usn,
          phone,
          department: dept,
          semester: sem,
          quizAnswers: window.__obQuizAnswers
        };

        const res = await fetch(`${API_BASE}/auth/complete-onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        const json = await res.json();

        if (json.success && json.data) {
          const studentData = json.data.user || json.data;
          authToken = json.data.token || token;
          localStorage.setItem('booknexus_token', authToken);
          localStorage.setItem('bookhive_token', authToken);
          localStorage.setItem('currentUser', JSON.stringify(studentData));
          sessionStorage.setItem('booknexus_token', authToken);
          sessionStorage.setItem('currentUser', JSON.stringify(studentData));
          window.currentUser = studentData;
          window.currentRole = 'student';

          if (typeof closeModal === 'function') closeModal('authModal');
          if (typeof origFinishStudent === 'function') origFinishStudent(studentData);
          if (typeof window.nxSessionSet === 'function') window.nxSessionSet('student', studentData.usn || studentData._id, studentData.name, studentData.email);
          if (typeof showToast === 'function') showToast(`Onboarding complete! Welcome, ${studentData.name}!`, 'success');
          if (typeof updateNavProfile === 'function') updateNavProfile();
          if (typeof switchNav === 'function') switchNav('dashboard');
          if (typeof window.fetchLiveRentalsAndSync === 'function') window.fetchLiveRentalsAndSync();
          if (typeof window.fetchLiveTransactions === 'function') window.fetchLiveTransactions();
          return;
        } else {
          if (banner) {
            banner.className = 'nxa-banner bad';
            banner.textContent = json.message || 'Onboarding completion failed.';
            banner.hidden = false;
          }
        }
      } catch (err) {
        console.error('Complete onboarding API error:', err);
        if (banner) {
          banner.className = 'nxa-banner bad';
          banner.textContent = 'Network error during onboarding. Please try again.';
          banner.hidden = false;
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = origText; }
      }
    };

    // Staff role-login is handled centrally by window.nxaDoSt connected to /api/auth/role-login
  }

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

  let cachedNotifications = [];

  window.closeEmailPreview = function () {
    const modal = document.getElementById('emailPreviewModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  window.openEmailPreview = function (index) {
    const notif = cachedNotifications[index];
    if (!notif) return;
    const modal = document.getElementById('emailPreviewModal');
    const subjEl = document.getElementById('emailPreviewSubject');
    const recipEl = document.getElementById('emailPreviewRecipient');
    const dateEl = document.getElementById('emailPreviewDate');
    const bodyEl = document.getElementById('emailPreviewBody');

    if (subjEl) subjEl.textContent = notif.subject || notif.title || 'Email Notification';
    if (recipEl) recipEl.textContent = 'To: ' + (notif.userEmail || (currentUser && currentUser.email) || 'scholar@univ.edu');
    if (dateEl) dateEl.textContent = notif.createdAt ? new Date(notif.createdAt).toLocaleString() : 'Just now';
    if (bodyEl) {
      bodyEl.innerHTML = notif.html || `<p>${notif.preview || notif.title}</p>`;
    }
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  };

  window.testAllEmailNotifications = async function () {
    const targetEmail = (currentUser && currentUser.email) ? currentUser.email : '';
    if (!targetEmail) {
      if (typeof showToast === 'function') showToast('Please sign in to send email notifications.', 'warning');
      return;
    }
    const targetName = (currentUser && currentUser.name) ? currentUser.name : targetEmail.split('@')[0];
    if (typeof showToast === 'function') showToast(`Triggering lifecycle emails for ${targetEmail}...`, 'info');

    try {
      const res = await fetch(`${API_BASE}/notifications/test-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, name: targetName })
      });
      const data = await res.json();
      if (data && data.success) {
        if (typeof showToast === 'function') {
          showToast(`✅ All 8 lifecycle emails sent to ${targetEmail}!`, 'success');
        }
        await fetchLiveNotifications();
      }
    } catch (err) {
      console.warn('Test all notifications warning:', err.message);
    }
  };

  async function fetchLiveNotifications() {
    try {
      const email = (currentUser && currentUser.email) ? currentUser.email : '';
      const res = await fetch(`${API_BASE}/notifications${email ? '?email=' + encodeURIComponent(email) : ''}`);
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        cachedNotifications = json.data;
        const c = document.getElementById('notificationsList');
        const badge = document.getElementById('notifBadge');
        const cnt = document.getElementById('notifCountText');

        if (cnt) cnt.innerText = `${json.data.length} Notifications`;
        if (badge) {
          badge.innerText = json.data.length;
          badge.style.display = json.data.length > 0 ? 'flex' : 'none';
        }

        if (json.data.length === 0) {
          if (c) {
            c.innerHTML = `
              <div class="py-12 px-4 text-center">
                <span class="material-symbols-outlined text-4xl text-gray-400 mb-2">notifications_none</span>
                <p class="text-sm font-bold text-brand-rosewood dark:text-gray-200">No notifications yet</p>
                <p class="text-xs text-gray-500 mt-1">When you borrow, rent, or return books, activity alerts will appear here.</p>
              </div>`;
          }
          return;
        }

        if (c) {
          const typeIcons = {
            sign_in: { icon: 'lock', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Sign-In Alert' },
            book_buying: { icon: 'shopping_bag', color: 'text-amber-800 bg-amber-50 border-amber-200', label: 'Order Placed' },
            pending: { icon: 'hourglass_empty', color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Pending Status' },
            accepted: { icon: 'check_circle', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', label: 'Book Accepted' },
            otp: { icon: 'key', color: 'text-amber-700 bg-amber-50 border-amber-200', label: 'Pickup OTP' },
            successfully_received: { icon: 'menu_book', color: 'text-blue-700 bg-blue-50 border-blue-200', label: 'Book Received' },
            penalty: { icon: 'warning', color: 'text-rose-700 bg-rose-50 border-rose-200', label: 'Late Penalty' },
            completed: { icon: 'verified', color: 'text-emerald-800 bg-emerald-50 border-emerald-200', label: 'Completed' },
          };

          const testBtnHtml = `
            <div class="p-3 mb-3 bg-gradient-to-r from-amber-500/15 via-brand-rosewood/15 to-amber-500/15 rounded-xl border border-amber-500/30 text-center shadow-sm">
              <div class="text-[11px] font-bold text-brand-rosewood dark:text-white mb-1">📧 Email Notification Simulator</div>
              <p class="text-[10px] text-gray-500 dark:text-gray-300 mb-2">Simulate real student notifications for your active account.</p>
              <button onclick="window.testAllEmailNotifications()" class="w-full py-1.5 px-3 bg-brand-rosewood hover:bg-brand-rosewoodHover text-white text-xs font-bold rounded-full shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-1.5">
                <span class="material-symbols-outlined text-xs">bolt</span>
                Test All 8 Email Notifications
              </button>
            </div>
          `;

          const itemsHtml = json.data.map((n, idx) => {
            const conf = typeIcons[n.type] || { icon: 'mail', color: 'text-gray-700 bg-gray-50 border-gray-200', label: 'Notification' };
            const timeStr = n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent';
            return `
              <div onclick="window.openEmailPreview(${idx})" class="p-3 rounded-xl bg-white dark:bg-brand-darkCard border border-brand-rosewood/15 hover:border-brand-rosewood/40 shadow-sm cursor-pointer transition-all hover:-translate-y-0.5 space-y-1.5">
                <div class="flex items-center justify-between gap-1">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${conf.color}">
                    <span class="material-symbols-outlined text-[11px]">${conf.icon}</span>
                    ${conf.label}
                  </span>
                  <span class="text-[10px] text-gray-400 font-medium">${timeStr}</span>
                </div>
                <h4 class="font-bold text-xs text-brand-rosewood dark:text-white line-clamp-1">${n.title}</h4>
                <p class="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-2">${n.preview || n.subject}</p>
                <div class="flex justify-between items-center pt-1 text-[10px] text-brand-rosewood dark:text-brand-dustyRose font-bold">
                  <span>To: ${n.userEmail}</span>
                  <span class="inline-flex items-center gap-0.5 underline">View Full Email &rarr;</span>
                </div>
              </div>
            `;
          }).join('');

          c.innerHTML = testBtnHtml + itemsHtml;
        }
      }
    } catch (err) {
      console.warn('Live notifications fetch notice:', err.message);
    }
  }

  function hookEmailNotifications() {
    const origToggle = window.toggleNotificationDrawer;
    window.toggleNotificationDrawer = function () {
      if (typeof origToggle === 'function') origToggle.apply(this, arguments);
      fetchLiveNotifications();
    };

    setTimeout(fetchLiveNotifications, 1500);
  }

  /* ==========================================================================
     CAMPUS UPI PAYMENT, STUDENT DASHBOARD TRACKING & LIBRARIAN VERIFICATION
     ========================================================================== */

  function getAuthToken() {
    return authToken || localStorage.getItem('booknexus_token') || localStorage.getItem('bookhive_token') || '';
  }

  let liveTransactions = [];
  let liveRentals = [];
  let currentPaymentTxn = null;

  function ensureCampusUpiModal() {
    if (document.getElementById('campusUpiModal')) return;

    const modalHtml = `
    <div id="campusUpiModal" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm hidden flex items-center justify-center p-4">
      <div class="bg-brand-ivory dark:bg-brand-darkSurface rounded-3xl max-w-lg w-full p-6 sm:p-7 relative border border-brand-rosewood/20 shadow-2xl space-y-5">
        <button type="button" onclick="window.closeCampusUpiModal()" class="absolute top-5 right-5 text-gray-400 hover:text-brand-rosewood dark:hover:text-white p-1 rounded-full">
          <span class="material-symbols-outlined text-2xl">close</span>
        </button>

        <div class="flex items-center gap-3 border-b border-brand-rosewood/15 pb-4">
          <div class="w-10 h-10 rounded-2xl bg-brand-rosewood/10 text-brand-rosewood dark:text-brand-dustyRose flex items-center justify-center">
            <span class="material-symbols-outlined text-2xl">qr_code_2</span>
          </div>
          <div>
            <h3 class="font-display text-xl font-bold text-brand-rosewood dark:text-white">Campus UPI Payment</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">Zero-fee campus digital settlement</p>
          </div>
        </div>

        <div class="bg-brand-cream dark:bg-brand-darkCard p-4 rounded-2xl border border-brand-rosewood/15 space-y-2">
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-500 font-medium">Purpose:</span>
            <span id="upiModalPurpose" class="font-bold text-brand-rosewood dark:text-white">Library Overdue Fine</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-500 font-medium">Resource:</span>
            <span id="upiModalBookTitle" class="font-bold text-brand-rosewood dark:text-white truncate max-w-[200px]">Clean Code</span>
          </div>
          <div class="flex justify-between items-center text-xs">
            <span class="text-gray-500 font-medium">Transaction Ref:</span>
            <span id="upiModalTxnRef" class="font-mono font-bold text-brand-rosewood dark:text-brand-dustyRose">TXN-0000</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-brand-rosewood/10">
            <span class="font-bold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300">Amount Due:</span>
            <span id="upiModalAmount" class="font-display font-extrabold text-2xl text-brand-rosewood dark:text-brand-dustyRose">₹0.00</span>
          </div>
        </div>

        <div id="upiConfiguredContainer" class="space-y-4">
          <div class="flex flex-col items-center justify-center p-4 bg-white dark:bg-brand-darkCard rounded-2xl border border-brand-rosewood/15 shadow-inner">
            <div id="upiQrCodeWrapper" class="w-48 h-48 bg-gray-50 flex items-center justify-center rounded-xl overflow-hidden border border-gray-200">
              <img id="upiQrCodeImg" src="" alt="Campus UPI QR Code" class="w-full h-full object-contain" />
            </div>
            <p class="text-[11px] text-gray-500 mt-2 font-medium">Scan with GPay, PhonePe, Paytm or any UPI App</p>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-brand-parchment dark:bg-brand-darkSurface border border-brand-rosewood/15 text-xs">
            <div>
              <span class="text-[10px] uppercase font-bold text-gray-500 block">Campus UPI ID</span>
              <span id="upiModalPayeeVpa" class="font-mono font-bold text-brand-rosewood dark:text-white">booknexus.library@okhdfcbank</span>
            </div>
            <button type="button" onclick="window.copyCampusUpiId()" class="px-3 py-1.5 rounded-full bg-brand-rosewood text-white text-[11px] font-bold hover:bg-brand-rosewoodHover transition-colors flex items-center gap-1 shadow-sm">
              <span class="material-symbols-outlined text-sm">content_copy</span> Copy
            </button>
          </div>

          <div class="text-center">
            <a id="upiModalDeepLink" href="#" class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-rosewood dark:text-brand-dustyRose hover:underline">
              <span class="material-symbols-outlined text-sm">open_in_new</span> Pay directly in UPI App (Mobile)
            </a>
          </div>
        </div>

        <div id="upiUnconfiguredContainer" class="hidden p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
          <div class="flex items-center gap-2 font-bold text-sm">
            <span class="material-symbols-outlined text-amber-600">warning</span>
            Campus UPI ID Not Configured
          </div>
          <p>The campus administration has not configured an active UPI VPA in library settings. Please visit the library circulation desk to settle your dues in cash or via counter POS.</p>
        </div>

        <div class="space-y-3 pt-2 border-t border-brand-rosewood/15">
          <div>
            <label for="campusUpiUtrInput" class="block text-xs font-bold text-brand-rosewood dark:text-white mb-1">
              Enter 12-Digit UPI Reference / UTR Number <span class="text-red-500">*</span>
            </label>
            <input type="text" id="campusUpiUtrInput" placeholder="e.g. 429381029384" maxlength="30" class="w-full bg-white dark:bg-brand-darkCard border border-brand-rosewood/20 rounded-xl p-3 text-xs font-mono font-bold outline-none focus:border-brand-rosewood focus:ring-1 focus:ring-brand-rosewood" />
          </div>

          <div class="p-3 bg-brand-parchment/60 dark:bg-brand-darkSurface rounded-xl border border-brand-rosewood/10 text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
            <span class="font-bold text-brand-rosewood dark:text-brand-dustyRose">⚠️ Manual Librarian Verification Required:</span> Submitting this reference marks your payment as <span class="font-bold text-amber-700 bg-amber-100 px-1 py-0.5 rounded">Pending Verification</span>. The campus librarian will manually cross-reference your UTR against the college bank terminal before confirming settlement.
          </div>

          <button id="btnSubmitUpiUtr" type="button" onclick="window.submitCampusUpiUtr()" class="w-full py-3 px-4 bg-brand-rosewood hover:bg-brand-rosewoodHover text-white text-xs font-bold rounded-xl shadow transition-transform active:scale-95 flex items-center justify-center gap-2">
            <span class="material-symbols-outlined text-base">send</span>
            Submit Payment for Verification
          </button>
        </div>
      </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  window.closeCampusUpiModal = function() {
    const modal = document.getElementById('campusUpiModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  };

  window.copyCampusUpiId = function() {
    const vpa = document.getElementById('upiModalPayeeVpa')?.textContent || '';
    if (vpa && navigator.clipboard) {
      navigator.clipboard.writeText(vpa);
      if (typeof showToast === 'function') showToast('Campus UPI ID copied: ' + vpa, 'success');
    }
  };

  window.openCampusUpiPayModal = async function(opts = {}) {
    ensureCampusUpiModal();
    const token = getAuthToken();
    const modal = document.getElementById('campusUpiModal');

    const {
      rentalId = null,
      bookId = null,
      title = 'Library Materials',
      amount = 50,
      type = 'fine_payment',
      note = ''
    } = opts;

    if (typeof showToast === 'function') showToast('Initiating campus payment session...', 'info');

    try {
      const res = await fetch(`${API_BASE}/payments/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          rentalId,
          bookId,
          type,
          amount: Number(amount),
          note: note || `Payment for ${title}`
        })
      });

      const json = await res.json();
      if (!json || !json.success) {
        if (typeof showToast === 'function') showToast(json.message || 'Could not initiate payment', 'error');
        return;
      }

      currentPaymentTxn = json.data;

      document.getElementById('upiModalPurpose').textContent = (type || 'fine_payment').replace(/_/g, ' ').toUpperCase();
      document.getElementById('upiModalBookTitle').textContent = title;
      document.getElementById('upiModalTxnRef').textContent = currentPaymentTxn.transactionRef;
      document.getElementById('upiModalAmount').textContent = '₹' + Number(currentPaymentTxn.amount).toFixed(2);
      const utrEl = document.getElementById('campusUpiUtrInput');
      if (utrEl) utrEl.value = '';

      const upiContainer = document.getElementById('upiConfiguredContainer');
      const unconfigContainer = document.getElementById('upiUnconfiguredContainer');

      if (json.isUpiConfigured && json.upiUri) {
        if (upiContainer) upiContainer.classList.remove('hidden');
        if (unconfigContainer) unconfigContainer.classList.add('hidden');
        const vpaEl = document.getElementById('upiModalPayeeVpa');
        if (vpaEl) vpaEl.textContent = json.campusUpiId;
        const linkEl = document.getElementById('upiModalDeepLink');
        if (linkEl) linkEl.href = json.upiUri;

        const qrImg = document.getElementById('upiQrCodeImg');
        if (qrImg) {
          qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(json.upiUri)}`;
        }
      } else {
        if (upiContainer) upiContainer.classList.add('hidden');
        if (unconfigContainer) unconfigContainer.classList.remove('hidden');
      }

      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    } catch (err) {
      console.error('Initiate payment error:', err);
      if (typeof showToast === 'function') showToast('Server error: ' + err.message, 'error');
    }
  };

  window.submitCampusUpiUtr = async function() {
    if (!currentPaymentTxn) {
      if (typeof showToast === 'function') showToast('No active transaction found.', 'error');
      return;
    }

    const utrInput = document.getElementById('campusUpiUtrInput');
    const utrVal = (utrInput ? utrInput.value : '').trim();

    if (!utrVal || utrVal.length < 6) {
      if (typeof showToast === 'function') showToast('Please enter a valid 12-digit UPI Reference / UTR Number.', 'warning');
      if (utrInput) utrInput.focus();
      return;
    }

    const token = getAuthToken();
    const btn = document.getElementById('btnSubmitUpiUtr');
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(`${API_BASE}/payments/submit-utr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          transactionRef: currentPaymentTxn.transactionRef,
          utrNumber: utrVal
        })
      });

      const json = await res.json();
      if (json && json.success) {
        if (typeof showToast === 'function') {
          showToast('✅ Payment submitted! Status: Pending Verification by Librarian.', 'success');
        }
        window.closeCampusUpiModal();
        await fetchLiveTransactions();
        await fetchLiveRentalsAndSync();
      } else {
        if (typeof showToast === 'function') showToast(json.message || 'Submission failed', 'error');
      }
    } catch (err) {
      console.error('Submit UTR error:', err);
      if (typeof showToast === 'function') showToast('Connection error: ' + err.message, 'error');
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  window.librarianVerifyPayment = async function(transactionRef, amount) {
    if (!confirm(`Verify payment ${transactionRef} for ₹${amount}?\n\nThis confirms the funds have cleared on the campus bank terminal, resets student overdue penalties, and dispatches the official receipt email.`)) {
      return;
    }

    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE}/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          transactionRef,
          note: 'Manually verified by Librarian on campus bank terminal'
        })
      });

      const json = await res.json();
      if (json && json.success) {
        if (typeof showToast === 'function') {
          showToast(`✅ Payment ${transactionRef} verified! Receipt emailed to student.`, 'success');
        }
        await fetchLiveTransactions();
        await fetchLiveRentalsAndSync();
      } else {
        if (typeof showToast === 'function') showToast(json.message || 'Verification failed', 'error');
      }
    } catch (err) {
      console.error('Librarian verify error:', err);
      if (typeof showToast === 'function') showToast('Verification error: ' + err.message, 'error');
    }
  };

  window.librarianRejectPayment = async function(transactionRef) {
    const reason = prompt(`Enter reason for rejecting payment ${transactionRef}:`, 'UTR reference could not be located on campus bank statement.');
    if (reason === null) return;

    const token = getAuthToken();
    try {
      const res = await fetch(`${API_BASE}/payments/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          transactionRef,
          reason: reason || 'Invalid or unverified UPI reference.'
        })
      });

      const json = await res.json();
      if (json && json.success) {
        if (typeof showToast === 'function') {
          showToast(`❌ Payment ${transactionRef} rejected. Student notified.`, 'info');
        }
        await fetchLiveTransactions();
      } else {
        if (typeof showToast === 'function') showToast(json.message || 'Rejection failed', 'error');
      }
    } catch (err) {
      console.error('Librarian reject error:', err);
      if (typeof showToast === 'function') showToast('Rejection error: ' + err.message, 'error');
    }
  };

  function getStatusBadge(status, utr) {
    switch (status) {
      case 'initiated':
        return `<span class="inline-flex items-center gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-300">Initiated</span>`;
      case 'pending':
        return `<span class="inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300" title="UTR: ${utr || ''}">⏳ Pending Verification</span>`;
      case 'successful':
        return `<span class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">✓ Successful</span>`;
      case 'rejected':
        return `<span class="inline-flex items-center gap-1 bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300">✗ Rejected</span>`;
      case 'refunded':
        return `<span class="inline-flex items-center gap-1 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300">↺ Refunded</span>`;
      default:
        return `<span class="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">${status}</span>`;
    }
  }

  async function fetchLiveTransactions() {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/payments`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        liveTransactions = json.data;

        window.transactionsList = liveTransactions.map(t => ({
          id: t.transactionRef,
          title: (t.book && t.book.title) ? t.book.title : (t.type ? t.type.replace(/_/g, ' ') : 'Library Material'),
          type: t.type ? t.type.replace(/_/g, ' ').toUpperCase() : 'PAYMENT',
          date: new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          amount: '₹' + Number(t.amount).toFixed(2),
          status: t.status === 'initiated' ? 'Initiated' :
                  t.status === 'pending' ? 'Pending Verification' :
                  t.status === 'successful' ? 'Successful' :
                  t.status === 'rejected' ? 'Rejected' :
                  t.status === 'refunded' ? 'Refunded' : 'Completed',
          raw: t
        }));

        renderLiveStudentTransactions();
        renderLiveAdminLedger();
        renderLibrarianVerificationDesk();
      }
    } catch (err) {
      console.warn('Fetch live transactions notice:', err.message);
    }
  }

  function renderLiveStudentTransactions() {
    const tbody = document.getElementById('studentTransactionsTableBody');
    if (!tbody) return;

    if (!liveTransactions || !liveTransactions.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-10 text-center text-xs font-semibold text-gray-500">
            <span class="material-symbols-outlined text-3xl text-gray-400 block mb-1">receipt_long</span>
            No payment or transaction records found.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = liveTransactions.map(t => {
      const bTitle = t.book?.title || t.type?.replace(/_/g, ' ') || 'Library Material';
      const dateStr = new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      return `
        <tr class="hover:bg-brand-parchment/50">
          <td class="py-3 px-4 font-mono font-bold">${t.transactionRef}</td>
          <td class="py-3 px-4 font-bold">${bTitle}</td>
          <td class="py-3 px-4"><span class="bg-brand-rosewood/10 text-brand-rosewood text-[10px] font-bold px-2 py-0.5 rounded uppercase">${t.type?.replace(/_/g, ' ')}</span></td>
          <td class="py-3 px-4">${dateStr}</td>
          <td class="py-3 px-4 font-bold text-brand-rosewood">₹${Number(t.amount).toFixed(2)}</td>
          <td class="py-3 px-4">${getStatusBadge(t.status, t.gatewayReference)}</td>
          <td class="py-3 px-4 text-right">
            <button onclick="previewReceipt('${t.transactionRef}')" class="text-xs font-bold text-brand-rosewood hover:underline">View Receipt</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderLiveAdminLedger() {
    const tbody = document.getElementById('adminLedgerTableBody');
    if (!tbody) return;

    if (!liveTransactions || !liveTransactions.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-10 text-center text-xs font-semibold text-gray-500">
            <span class="material-symbols-outlined text-3xl text-gray-400 block mb-1">account_balance_wallet</span>
            No campus transactions recorded yet.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = liveTransactions.map(t => {
      const bTitle = t.book?.title || t.type?.replace(/_/g, ' ') || 'Library Material';
      const dateStr = new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const isPending = t.status === 'pending';
      return `
        <tr class="hover:bg-brand-parchment/50">
          <td class="py-3 px-4 font-mono font-bold">${t.transactionRef}</td>
          <td class="py-3 px-4 font-bold">${bTitle}<br><span class="text-[10px] text-gray-500 font-normal">Student: ${t.user?.name || 'Student'} (${t.user?.usn || ''})</span></td>
          <td class="py-3 px-4"><span class="bg-brand-rosewood/10 text-brand-rosewood text-[10px] font-bold px-2 py-0.5 rounded uppercase">${t.type?.replace(/_/g, ' ')}</span></td>
          <td class="py-3 px-4">${dateStr}</td>
          <td class="py-3 px-4 font-bold text-brand-rosewood">₹${Number(t.amount).toFixed(2)}</td>
          <td class="py-3 px-4">
            ${getStatusBadge(t.status, t.gatewayReference)}
            ${t.gatewayReference ? `<div class="text-[10px] font-mono text-gray-500 mt-0.5">UTR: ${t.gatewayReference}</div>` : ''}
          </td>
          <td class="py-3 px-4 text-right space-x-1">
            ${isPending ? `
              <button onclick="window.librarianVerifyPayment('${t.transactionRef}', ${t.amount})" class="px-2 py-1 bg-emerald-700 text-white rounded text-[11px] font-bold hover:bg-emerald-800">Verify</button>
              <button onclick="window.librarianRejectPayment('${t.transactionRef}')" class="px-2 py-1 bg-rose-700 text-white rounded text-[11px] font-bold hover:bg-rose-800">Reject</button>
            ` : `
              <button onclick="previewReceipt('${t.transactionRef}')" class="text-xs font-bold text-brand-rosewood hover:underline">Receipt</button>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderLibrarianVerificationDesk() {
    const host = document.getElementById('adminPanelLedger');
    if (!host) return;

    let deskEl = document.getElementById('campusUpiAdminDeskHost');
    if (!deskEl) {
      deskEl = document.createElement('div');
      deskEl.id = 'campusUpiAdminDeskHost';
      deskEl.className = 'my-4 space-y-4';
      host.insertBefore(deskEl, host.firstChild);
    }

    const pendingTxns = liveTransactions.filter(t => t.status === 'pending');

    deskEl.innerHTML = `
      <div class="p-5 bg-gradient-to-r from-amber-500/10 via-brand-rosewood/10 to-amber-500/10 rounded-2xl border border-amber-500/30 space-y-4 shadow-sm">
        <div class="flex flex-wrap justify-between items-center gap-2">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-brand-rosewood text-white flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-xl">verified_user</span>
            </div>
            <div>
              <h4 class="font-bold text-sm text-brand-rosewood dark:text-white">Campus UPI Payment Verification Desk</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400">Authorized manual verification of student UPI UTR references. Confirm against campus bank statement before clearing dues.</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full text-xs font-bold ${pendingTxns.length > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse' : 'bg-emerald-100 text-emerald-800'}">
              ${pendingTxns.length} Pending Verification
            </span>
            <button type="button" onclick="window.fetchLiveTransactions()" class="px-3 py-1 bg-white dark:bg-brand-darkCard border border-brand-rosewood/20 rounded-xl text-xs font-bold text-brand-rosewood hover:bg-brand-rosewood/10 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">refresh</span> Refresh
            </button>
          </div>
        </div>

        ${pendingTxns.length === 0 ? `
          <div class="p-4 rounded-xl bg-white/70 dark:bg-brand-darkCard/70 border border-brand-rosewood/10 text-center text-xs text-gray-500 font-medium">
            ✅ All student UPI payments are up to date. No pending UTR submissions awaiting verification.
          </div>
        ` : `
          <div class="overflow-x-auto rounded-xl border border-brand-rosewood/15 bg-white dark:bg-brand-darkCard">
            <table class="w-full text-xs text-left">
              <thead class="bg-brand-parchment dark:bg-brand-darkSurface uppercase text-[10px] text-gray-600 dark:text-gray-300">
                <tr>
                  <th class="py-2.5 px-3">Date</th>
                  <th class="py-2.5 px-3">Student</th>
                  <th class="py-2.5 px-3">Resource / Purpose</th>
                  <th class="py-2.5 px-3">Amount</th>
                  <th class="py-2.5 px-3">Txn Ref</th>
                  <th class="py-2.5 px-3">Submitted UTR</th>
                  <th class="py-2.5 px-3 text-right">Librarian Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-rosewood/10">
                ${pendingTxns.map(t => `
                  <tr class="hover:bg-brand-parchment/50">
                    <td class="py-2.5 px-3 text-gray-500">${new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td class="py-2.5 px-3 font-bold">${t.user?.name || 'Student'}<br><span class="text-[10px] font-mono text-gray-500">${t.user?.usn || ''}</span></td>
                    <td class="py-2.5 px-3">${t.book?.title || t.type?.replace(/_/g, ' ') || 'Library Material'}</td>
                    <td class="py-2.5 px-3 font-bold text-brand-rosewood">₹${Number(t.amount).toFixed(2)}</td>
                    <td class="py-2.5 px-3 font-mono text-[11px] font-bold text-gray-600">${t.transactionRef}</td>
                    <td class="py-2.5 px-3 font-mono font-bold text-amber-700 bg-amber-50/50">${t.gatewayReference || 'Awaiting UTR'}</td>
                    <td class="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
                      <button type="button" onclick="window.librarianVerifyPayment('${t.transactionRef}', ${t.amount})" class="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] shadow-sm transition-transform active:scale-95 inline-flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">check</span> Verify & Settle
                      </button>
                      <button type="button" onclick="window.librarianRejectPayment('${t.transactionRef}')" class="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-bold text-[11px] shadow-sm transition-transform active:scale-95 inline-flex items-center gap-1">
                        <span class="material-symbols-outlined text-xs">close</span> Reject
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }

  async function fetchLiveRentalsAndSync() {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/rentals`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        liveRentals = json.data;

        // Compute 6-metric tracking statistics
        const borrowPending = liveRentals.filter(r => r.status === 'requested' || r.status === 'pending').length;
        const borrowApproved = liveRentals.filter(r => r.status === 'approved').length;
        const borrowRejected = liveRentals.filter(r => r.status === 'rejected').length;

        const activeRentalsList = liveRentals.filter(r => r.status === 'active' || r.status === 'received' || r.status === 'approved');
        const latestActive = activeRentalsList[0];

        const returnsRequested = liveRentals.filter(r => r.status === 'returned').length;
        const returnsApproved = liveRentals.filter(r => r.status === 'approved' && r.returnDate).length;
        const returnsCompleted = liveRentals.filter(r => r.status === 'completed').length;

        const overdueRentals = liveRentals.filter(r => (r.penaltyAmount > 0) || r.status === 'overdue');
        const totalPenaltyAmount = overdueRentals.reduce((sum, r) => sum + (r.penaltyAmount || 0), 0);

        const payInitiated = liveTransactions.filter(t => t.status === 'initiated').length;
        const payPending = liveTransactions.filter(t => t.status === 'pending').length;
        const paySuccessful = liveTransactions.filter(t => t.status === 'successful').length;

        const stats = {
          borrowTotal: liveRentals.length,
          borrowPending,
          borrowApproved,
          borrowRejected,
          activeRentalsCount: activeRentalsList.length,
          latestActiveBook: latestActive?.book?.title || '',
          latestDueDate: latestActive?.dueDate ? new Date(latestActive.dueDate).toLocaleDateString('en-IN') : '',
          returnsTotal: returnsRequested + returnsApproved + returnsCompleted,
          returnsRequested,
          returnsApproved,
          returnsCompleted,
          overdueDays: overdueRentals.length > 0 ? 3 : 0,
          totalPenaltyAmount,
          overdueBookTitle: overdueRentals[0]?.book?.title || 'Academic Book',
          paymentsTotal: liveTransactions.length,
          payInitiated,
          payPending,
          paySuccessful
        };

        renderStudentDashboardTracker(stats);
      }
    } catch (err) {
      console.warn('Live rentals fetch notice:', err.message);
    }
  }

  function renderStudentDashboardTracker(stats = {}) {
    const host = document.getElementById('dashboardHost');
    if (!host) return;

    const trackerId = 'campusLifecycleTrackerHost';
    let trackerEl = document.getElementById(trackerId);
    if (!trackerEl) {
      trackerEl = document.createElement('div');
      trackerEl.id = trackerId;
      trackerEl.className = 'my-6';
      host.insertBefore(trackerEl, host.firstChild);
    }

    trackerEl.innerHTML = `
      <div class="p-6 bg-gradient-to-br from-brand-parchment via-brand-cream to-brand-parchment dark:from-brand-darkSurface dark:to-brand-darkCard rounded-3xl border border-brand-rosewood/20 shadow-md space-y-5">
        <div class="flex flex-wrap justify-between items-center gap-2 border-b border-brand-rosewood/15 pb-4">
          <div>
            <span class="text-[10px] uppercase font-extrabold tracking-widest text-brand-dustyRose">Academic &amp; Rental Operations</span>
            <h3 class="font-display text-xl font-bold text-brand-rosewood dark:text-white">Student Dashboard &amp; Payment Tracker</h3>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              MongoDB Synced
            </span>
            <button type="button" onclick="window.fetchLiveRentalsAndSync();window.fetchLiveTransactions();" class="p-1.5 rounded-xl bg-white dark:bg-brand-darkSurface border border-brand-rosewood/15 text-brand-rosewood dark:text-white hover:bg-brand-rosewood/10" title="Refresh Live Data">
              <span class="material-symbols-outlined text-base">refresh</span>
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div class="p-3.5 rounded-2xl bg-white dark:bg-brand-darkCard border border-brand-rosewood/10 shadow-sm space-y-1">
            <div class="text-[10px] font-extrabold uppercase text-gray-500">1. Borrow Requests</div>
            <div class="text-xl font-extrabold text-brand-rosewood dark:text-white">${stats.borrowTotal || 0}</div>
            <div class="text-[10px] space-y-0.5 text-gray-600 dark:text-gray-300">
              <div class="flex justify-between"><span>Pending:</span> <b class="text-amber-600">${stats.borrowPending || 0}</b></div>
              <div class="flex justify-between"><span>Approved:</span> <b class="text-emerald-600">${stats.borrowApproved || 0}</b></div>
              <div class="flex justify-between"><span>Rejected:</span> <b class="text-rose-600">${stats.borrowRejected || 0}</b></div>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white dark:bg-brand-darkCard border border-brand-rosewood/10 shadow-sm space-y-1">
            <div class="text-[10px] font-extrabold uppercase text-gray-500">2. Active Rentals</div>
            <div class="text-xl font-extrabold text-brand-rosewood dark:text-white">${stats.activeRentalsCount || 0}</div>
            <div class="text-[10px] text-gray-600 dark:text-gray-300 line-clamp-2">
              ${stats.latestActiveBook ? `<b>${stats.latestActiveBook}</b><br><span class="text-gray-400">Due: ${stats.latestDueDate || 'In Loan'}</span>` : 'No active books'}
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white dark:bg-brand-darkCard border border-brand-rosewood/10 shadow-sm space-y-1">
            <div class="text-[10px] font-extrabold uppercase text-gray-500">3. Returns</div>
            <div class="text-xl font-extrabold text-brand-rosewood dark:text-white">${stats.returnsTotal || 0}</div>
            <div class="text-[10px] space-y-0.5 text-gray-600 dark:text-gray-300">
              <div class="flex justify-between"><span>Requested:</span> <b>${stats.returnsRequested || 0}</b></div>
              <div class="flex justify-between"><span>Approved:</span> <b>${stats.returnsApproved || 0}</b></div>
              <div class="flex justify-between"><span>Completed:</span> <b class="text-emerald-600">${stats.returnsCompleted || 0}</b></div>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white dark:bg-brand-darkCard border ${stats.totalPenaltyAmount > 0 ? 'border-rose-400 bg-rose-50/30' : 'border-brand-rosewood/10'} shadow-sm space-y-1">
            <div class="text-[10px] font-extrabold uppercase text-gray-500">4. Overdue Penalties</div>
            <div class="text-xl font-extrabold ${stats.totalPenaltyAmount > 0 ? 'text-rose-600' : 'text-brand-rosewood dark:text-white'}">₹${stats.totalPenaltyAmount || 0}</div>
            <div class="text-[10px] text-gray-600 dark:text-gray-300">
              <div>Days Overdue: <b>${stats.overdueDays || 0}d</b></div>
              <div class="mt-1">
                ${stats.totalPenaltyAmount > 0 ? `
                  <button type="button" onclick="window.openCampusUpiPayModal({ title: '${stats.overdueBookTitle || 'Library Overdue Book'}', amount: ${stats.totalPenaltyAmount}, type: 'fine_payment' })" class="w-full py-1 px-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-[10px] shadow-sm flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-xs">payments</span> Pay Fine
                  </button>
                ` : '<span class="text-emerald-600 font-bold">No Fines Due</span>'}
              </div>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white dark:bg-brand-darkCard border border-brand-rosewood/10 shadow-sm space-y-1">
            <div class="text-[10px] font-extrabold uppercase text-gray-500">5. Payment States</div>
            <div class="text-xl font-extrabold text-brand-rosewood dark:text-white">${stats.paymentsTotal || 0}</div>
            <div class="text-[10px] space-y-0.5 text-gray-600 dark:text-gray-300">
              <div class="flex justify-between"><span>Initiated:</span> <b>${stats.payInitiated || 0}</b></div>
              <div class="flex justify-between"><span>Pending:</span> <b class="text-amber-600">${stats.payPending || 0}</b></div>
              <div class="flex justify-between"><span>Verified:</span> <b class="text-emerald-600">${stats.paySuccessful || 0}</b></div>
            </div>
          </div>

          <div class="p-3.5 rounded-2xl bg-white dark:bg-brand-darkCard border border-brand-rosewood/10 shadow-sm space-y-1 flex flex-col justify-between">
            <div>
              <div class="text-[10px] font-extrabold uppercase text-gray-500">6. Ledger</div>
              <div class="text-xl font-extrabold text-brand-rosewood dark:text-white">${liveTransactions.length}</div>
              <p class="text-[10px] text-gray-500">Verified receipts &amp; statement history</p>
            </div>
            <button type="button" onclick="if(typeof switchNav==='function')switchNav('transactions');" class="w-full py-1 px-2 rounded-lg bg-brand-rosewood text-white text-[10px] font-bold hover:bg-brand-rosewoodHover flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-xs">receipt_long</span> View Ledger
            </button>
          </div>
        </div>
        ${(!stats.borrowTotal && !stats.activeRentalsCount && !stats.returnsTotal && !stats.paymentsTotal && !stats.totalPenaltyAmount) ? `
          <div class="p-4 rounded-2xl bg-white/80 dark:bg-brand-darkCard border border-brand-rosewood/15 text-center mt-3">
            <span class="material-symbols-outlined text-2xl text-brand-sage block mb-1">auto_stories</span>
            <p class="text-xs font-bold text-brand-rosewood dark:text-white">You haven't borrowed or rented any books yet. Explore the catalog to get started.</p>
            <button type="button" onclick="if(typeof switchNav==='function')switchNav('browse');" class="mt-2.5 px-4 py-1.5 rounded-full bg-brand-rosewood text-white text-[11px] font-bold shadow-sm hover:bg-brand-rosewoodHover inline-flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">explore</span> Explore Catalog
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  function hookPayFineButtons() {
    const origRenderLibTabs = window.renderStudentLibraryTabs;
    if (typeof origLibTabsHooked === 'undefined') {
      window.origLibTabsHooked = true;
      if (typeof origRenderLibTabs === 'function') {
        window.renderStudentLibraryTabs = function () {
          origRenderLibTabs.apply(this, arguments);
          injectPayFineButtonsIntoTables();
        };
      }
    }

    const origRenderRentals = window.renderMyRentals;
    if (typeof origRentalsHooked === 'undefined') {
      window.origRentalsHooked = true;
      if (typeof origRenderRentals === 'function') {
        window.renderMyRentals = function () {
          origRenderRentals.apply(this, arguments);
          injectPayFineButtonsIntoTables();
        };
      }
    }
  }

  function injectPayFineButtonsIntoTables() {
    // 1. Check Library Borrowed Books Table for unpaid late fines
    const libTable = document.querySelector('#viewStudentLibrary table tbody');
    if (libTable) {
      libTable.querySelectorAll('tr').forEach(tr => {
        const text = tr.innerText || '';
        if (text.includes('₹') && (text.includes('Late') || text.includes('Overdue') || text.includes('Fine Pending') || text.includes('Fine Unpaid'))) {
          if (!tr.querySelector('.pay-fine-injected-btn')) {
            const bTitle = tr.querySelector('td:first-child')?.innerText?.trim() || 'Overdue Library Book';
            const fineMatch = text.match(/₹\s*(\d+)/);
            const fineAmt = fineMatch ? parseInt(fineMatch[1], 10) : 50;

            const fineCell = tr.querySelector('td:last-child');
            if (fineCell && fineAmt > 0) {
              const payBtn = document.createElement('div');
              payBtn.className = 'mt-1 pay-fine-injected-btn';
              payBtn.innerHTML = `
                <button type="button" onclick="window.openCampusUpiPayModal({ title: '${bTitle.replace(/'/g, "\\'")}', amount: ${fineAmt}, type: 'fine_payment' })" class="px-2 py-1 bg-brand-rosewood hover:bg-brand-rosewoodHover text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-sm">
                  <span class="material-symbols-outlined text-xs">payments</span> Pay Fine (UPI)
                </button>
              `;
              fineCell.appendChild(payBtn);
            }
          }
        }
      });
    }
  }

  const origPreviewReceipt = window.previewReceipt;
  window.previewReceipt = function(txnId) {
    const t = (window.transactionsList || []).find(x => x.id === txnId);
    if (t && t.raw) {
      const raw = t.raw;
      const recId = document.getElementById('recTxnId');
      const recName = document.getElementById('recStudentName');
      const recRoll = document.getElementById('recStudentRoll');
      const recType = document.getElementById('recTxnType');
      const recTitle = document.getElementById('recBookTitle');
      const recDate = document.getElementById('recTxnDate');
      const recAmt = document.getElementById('recAmount');

      if (recId) recId.innerText = raw.transactionRef;
      if (recName) recName.innerText = raw.user?.name || (window.currentUser && window.currentUser.name) || 'Student';
      if (recRoll) recRoll.innerText = raw.user?.usn || (window.currentUser && window.currentUser.rollNo) || 'CS2026';
      if (recType) recType.innerText = raw.type ? raw.type.replace(/_/g, ' ').toUpperCase() : 'PAYMENT';
      if (recTitle) recTitle.innerText = raw.book?.title || raw.type?.replace(/_/g, ' ') || 'Library Materials';
      if (recDate) recDate.innerText = new Date(raw.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      if (recAmt) recAmt.innerText = '₹' + Number(raw.amount).toFixed(2);

      if (typeof openModal === 'function') openModal('receiptPreviewModal');
      return;
    }
    if (typeof origPreviewReceipt === 'function') origPreviewReceipt.call(this, txnId);
  };

  window.fetchLiveTransactions = fetchLiveTransactions;
  window.fetchLiveRentalsAndSync = fetchLiveRentalsAndSync;

  function initCampusPaymentSystem() {
    ensureCampusUpiModal();
    hookPayFineButtons();
    setTimeout(() => {
      fetchLiveTransactions();
      fetchLiveRentalsAndSync();
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupRealData();
      hookAuth();
      hookRentalBlockchain();
      hookEmailNotifications();
      initCampusPaymentSystem();
      if (typeof window.updateNavProfile === 'function') window.updateNavProfile();
    });
  } else {
    setupRealData();
    hookAuth();
    hookRentalBlockchain();
    hookEmailNotifications();
    initCampusPaymentSystem();
    if (typeof window.updateNavProfile === 'function') window.updateNavProfile();
  }
})();
