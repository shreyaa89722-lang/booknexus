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
  } catch (e) { }

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

      if (typeof renderHomeHero === 'function') renderHomeHero();
      if (typeof renderHomeShelf === 'function') renderHomeShelf();
      if (typeof gxRender === 'function') gxRender();

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
        let nextNumericId = 10000;
        data.data.forEach(bb => {
          const exists = booksData.some(b => b.title.toLowerCase() === bb.title.toLowerCase());
          if (!exists) {
            nextNumericId++;
            booksData.unshift({
              id: nextNumericId,
              backendId: bb._id,
              mongoId: bb._id,
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
              demand: 15,
              cover: bb.coverUrl || (typeof window.bnxCoverArt === 'function' ? window.bnxCoverArt({ title: bb.title, author: bb.author, genre: bb.genre }) : ('data:image/svg+xml;utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 300 450\'%3E%3Crect width=\'300\' height=\'450\' fill=\'%2346282A\'/ %3E%3Ctext x=\'150\' y=\'225\' text-anchor=\'middle\' fill=\'%23FBF1E6\' font-size=\'18\'%3E' + encodeURIComponent(bb.title) + '%3C/text%3E%3C/svg%3E'))
            });
          }
        });
        if (typeof renderBookGrid === 'function') renderBookGrid();
        if (typeof renderHomeStats === 'function') renderHomeStats();
        if (typeof renderHomeHero === 'function') renderHomeHero();
        if (typeof renderHomeShelf === 'function') renderHomeShelf();
        if (typeof gxRender === 'function') gxRender();
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

    // ===================================================================
    // GOOGLE IDENTITY SERVICES — the only way a student signs in.
    //
    // We use the ID-token flow on purpose: clicking the button opens Google's
    // own account chooser and hands us a signed JWT, which the backend then
    // verifies with google-auth-library (signature, audience, issuer and
    // email_verified) before checking the email against college records.
    // The older OAuth2 access-token flow was removed so there is exactly one
    // audited path in and no way to reach the server with an unverified email.
    // ===================================================================
    let googleClientId = "678657142900-oibcoi8ind88u1l11e6mgk5cic8qqasm.apps.googleusercontent.com";
    let gsiReady = false;
    let tokenClient = null;

    function googleError(message) {
      const el = document.getElementById('nxlGoogleE');
      if (el) { el.textContent = message; el.hidden = false; }
      const banner = document.getElementById('nxaBanner');
      if (banner) { banner.className = 'nxa-banner bad'; banner.textContent = message; banner.hidden = false; }
      if (typeof showToast === 'function') showToast(message, 'error');
    }

    function clearGoogleError() {
      const el = document.getElementById('nxlGoogleE');
      if (el) { el.hidden = true; el.textContent = ''; }
    }

    async function initGoogleAuth() {
      try {
        const res = await fetch(`${API_BASE}/auth/google/config`);
        if (res.ok) {
          const cfg = await res.json();
          if (cfg && cfg.clientId) googleClientId = cfg.clientId;
        }
      } catch (e) {
        console.warn('Google config notice:', e.message);
      }

      // Render Google's official button. It is the primary control: the branded
      // fallback button underneath it is hidden as soon as this succeeds.
      function renderGsiButton() {
        const host = document.getElementById('g_id_signin_overlay');
        if (!host || !window.google || !window.google.accounts || !window.google.accounts.id || !window.google.accounts.id.renderButton) return false;
        try {
          host.innerHTML = '';
          const wrap = host.parentElement;
          const width = Math.max(240, Math.min(400, Math.round((wrap && wrap.getBoundingClientRect().width) || 320)));
          window.google.accounts.id.renderButton(host, {
            type: 'standard',
            theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: width,
            logo_alignment: 'left'
          });
          host.classList.add('on');
          if (wrap) wrap.classList.add('gsi-ready');
          return true;
        } catch (rErr) {
          console.warn('GSI renderButton error:', rErr.message);
          return false;
        }
      }
      window.renderGoogleButtonOverlay = renderGsiButton;

      function setupGSI() {
        if (!window.google || !window.google.accounts) return false;
        try {
          if (window.google.accounts.id) {
            window.google.accounts.id.initialize({
              client_id: googleClientId,
              callback: handleGoogleCredentialResponse,
              auto_select: false,
              cancel_on_tap_outside: true,
              use_fedcm_for_prompt: true
            });
            gsiReady = true;
            renderGsiButton();
          }

          if (window.google.accounts.oauth2) {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
              client_id: googleClientId,
              scope: 'email profile openid',
              callback: async (tokenResponse) => {
                if (tokenResponse && tokenResponse.access_token) {
                  clearGoogleError();
                  await sendGoogleTokenToBackend({ accessToken: tokenResponse.access_token });
                } else if (tokenResponse && tokenResponse.error) {
                  console.warn('OAuth token error:', tokenResponse.error);
                  googleError('Google sign-in was canceled or failed: ' + tokenResponse.error);
                }
              },
              error_callback: (err) => {
                console.warn('Google token error:', err);
                googleError('Google sign-in error: ' + (err.message || err.type || 'Popup blocked or canceled'));
              }
            });
          }
          return true;
        } catch (err) {
          console.warn('GSI setup notice:', err.message);
          return false;
        }
      }

      if (!setupGSI()) {
        let tries = 0;
        const t = setInterval(() => {
          tries++;
          if (setupGSI() || tries > 20) clearInterval(t);
        }, 500);
      }
    }
    window.initGoogleAuth = initGoogleAuth;

    // Re-render the Google button whenever the sign-in window opens, so it is
    // sized for the modal and matches the current light / dark theme.
    (function watchAuthModal() {
      const modal = document.getElementById('authModal');
      if (!modal || !window.MutationObserver) return;
      new MutationObserver(() => {
        if (!modal.classList.contains('hidden') && typeof window.renderGoogleButtonOverlay === 'function') {
          setTimeout(() => window.renderGoogleButtonOverlay(), 30);
        }
      }).observe(modal, { attributes: true, attributeFilter: ['class', 'style'] });
    })();

    async function handleGoogleCredentialResponse(response) {
      if (!response || !response.credential) {
        console.warn('Google sign-in returned no ID token');
        googleError('Google did not return a sign-in token. Please try again.');
        return;
      }
      clearGoogleError();
      await sendGoogleTokenToBackend({ credential: response.credential });
    }
    // In-memory state for Google-authenticated onboarding
    window.__googleOnboardingData = null;

    const QUIZ_QUESTIONS = [
      {
        q: "What pulls you into a book?",
        opts: [
          ["a", "A story to get lost in (Fiction & Literature)"],
          ["b", "Something real that happened (Non-fiction & History)"],
          ["c", "How things work (Science & Engineering)"],
          ["d", "Ideas that change how I think (Philosophy)"],
          ["e", "Ways to improve my life (Self-help)"],
          ["f", "Clear explanations for my course (Academic/Textbook)"]
        ]
      },
      {
        q: "It's midnight and the library is yours. Where do you wander?",
        opts: [
          ["a", "Fantasy, novels and classics"],
          ["b", "Old maps and dusty archives"],
          ["c", "Circuit boards and lab manuals"],
          ["d", "A quiet corner with big questions"],
          ["e", "A study desk piled with notes"],
          ["f", "The self-growth shelf"]
        ]
      },
      {
        q: "Which subjects do you enjoy most?",
        opts: [
          ["a", "Numbers and logic (Mathematics & CS)"],
          ["b", "Machines and building things (Engineering)"],
          ["c", "The past and its people (History)"],
          ["d", "Life and the universe (Science)"],
          ["e", "Language and storytelling (Literature)"],
          ["f", "The mind and habits (Self-help)"]
        ]
      },
      {
        q: "Who would you invite to dinner?",
        opts: [
          ["a", "A scientist who just made a discovery"],
          ["b", "A historian with wild stories"],
          ["c", "A philosopher who loves to argue"],
          ["d", "A founder who built something big"],
          ["e", "An inventor with a toolbox"],
          ["f", "A novelist with a plot twist"]
        ]
      },
      {
        q: "A free rainy afternoon. What are you doing?",
        opts: [
          ["a", "Curled up with a gripping novel"],
          ["b", "Watching a documentary, then researching it"],
          ["c", "Solving puzzles or writing code"],
          ["d", "Journaling and planning goals"],
          ["e", "Taking something apart to see how it works"],
          ["f", "Reading someone's inspiring life story"]
        ]
      },
      {
        q: "What do you usually read for?",
        opts: [
          ["a", "Exams and coursework"],
          ["b", "Skills for my career"],
          ["c", "Personal growth & reflection"],
          ["d", "Escape and relaxation"],
          ["e", "Pure curiosity about the world"]
        ]
      }
    ];

    // Reading-interest quiz. Nothing is pre-selected: the student answers all
    // six questions, and the backend recomputes their genres from the answers.
    window.__googleQuizAnswers = {};
    window.bnxQuizLength = QUIZ_QUESTIONS.length;

    function quizAnsweredCount() {
      let n = 0;
      for (let i = 0; i < QUIZ_QUESTIONS.length; i++) {
        const a = window.__googleQuizAnswers[i];
        if (Array.isArray(a) && a.length) n++;
      }
      return n;
    }

    function renderReadingQuizOnPage3() {
      const genBox = document.getElementById('nxlGen');
      if (!genBox) return;

      const genL = document.getElementById('nxlGenL');
      if (genL) genL.textContent = 'Reading-interest quiz';

      const answered = quizAnsweredCount();
      let html = `<p class="nxa-hint" style="margin:0 0 8px">Answer all ${QUIZ_QUESTIONS.length} questions — pick as many options as you like. <b>${answered} of ${QUIZ_QUESTIONS.length} answered.</b></p>`;
      html += `<div id="bnxQuizContainer" style="display:flex;flex-direction:column;gap:12px;margin-top:6px;max-height:320px;overflow-y:auto;padding-right:4px;">`;

      QUIZ_QUESTIONS.forEach((Q, qi) => {
        const sel = window.__googleQuizAnswers[qi] || [];
        html += `<div style="background:rgba(243,233,216,0.4);border:1px solid rgba(166,123,125,${sel.length ? '0.25' : '0.45'});border-radius:12px;padding:10px 12px;">
          <p style="font-weight:700;font-size:12px;margin:0 0 6px;color:var(--nx-ivory,#46282A);">Q${qi + 1}. ${Q.q}</p>
          <div style="display:grid;grid-template-columns:1fr;gap:4px;">
            ${Q.opts.map(([optId, optLabel]) => {
          const isSelected = sel.includes(optId);
          return `<button type="button" class="bnx-quiz-pill" data-qi="${qi}" data-opt="${optId}" aria-pressed="${isSelected}" style="text-align:left;padding:6px 10px;border-radius:8px;font-size:11.5px;font-weight:${isSelected ? '700' : '500'};border:1px solid ${isSelected ? '#C9AE7E' : 'rgba(166,123,125,0.25)'};background:${isSelected ? '#46282A' : 'rgba(255,255,255,0.7)'};color:${isSelected ? '#FDFBF7' : '#3F2528'};cursor:pointer;transition:all 0.15s ease;">
                <span style="display:inline-block;width:14px;height:14px;line-height:14px;text-align:center;border-radius:50%;font-size:9px;margin-right:6px;background:${isSelected ? '#C9AE7E' : 'rgba(166,123,125,0.2)'};color:${isSelected ? '#1B140D' : 'inherit'};font-weight:700;">${optId.toUpperCase()}</span>${optLabel}
              </button>`;
        }).join('')}
          </div>
        </div>`;
      });

      html += `</div>`;
      genBox.innerHTML = html;

      genBox.querySelectorAll('.bnx-quiz-pill').forEach(btn => {
        btn.onclick = function (e) {
          e.preventDefault();
          const qi = parseInt(this.getAttribute('data-qi'), 10);
          const opt = this.getAttribute('data-opt');
          const current = window.__googleQuizAnswers[qi] || [];
          const idx = current.indexOf(opt);
          if (idx >= 0) current.splice(idx, 1);
          else current.push(opt);
          window.__googleQuizAnswers[qi] = current;
          const err = document.getElementById('nxlGenE');
          if (err) { err.hidden = true; err.textContent = ''; }
          renderReadingQuizOnPage3();
        };
      });
    }
    window.renderReadingQuizOnPage3 = renderReadingQuizOnPage3;

    // ---- STEP 1 of first-time registration -------------------------------
    // Reached only when the backend confirmed the Google email is in the
    // approved college records AND the student has no BookNexus profile yet.
    // `session.onboardingToken` is a 30-minute registration token, NOT a login
    // token: it is deliberately never stored as the app's auth token.
    function openGoogleStudentOnboarding(session) {
      const record = session.collegeRecord || {};
      const saved = session.saved || {};

      window.__googleOnboardingData = {
        email: session.email,
        googleId: session.googleId,
        onboardingToken: session.onboardingToken,
        collegeRecord: record,
        saved: saved,
        name: '',
        usn: '',
        dob: ''
      };
      window.__googleQuizAnswers = {};

      const authModal = document.getElementById('authModal');
      if (authModal) {
        authModal.classList.remove('hidden');
        authModal.style.display = 'flex';
      }

      const nxaUser = document.getElementById('nxaUser');
      if (nxaUser) nxaUser.hidden = false;
      const nxaStaff = document.getElementById('nxaStaff');
      if (nxaStaff) nxaStaff.hidden = true;
      const nxa = document.getElementById('nxa');
      if (nxa) nxa.classList.remove('nx-roles');
      const nxaRp = document.getElementById('nxaRp');
      if (nxaRp) nxaRp.hidden = true;
      const nxaBanner = document.getElementById('nxaBanner');
      if (nxaBanner) { nxaBanner.hidden = true; nxaBanner.textContent = ''; }

      const chooser = document.getElementById('nxaVCh');
      if (chooser) chooser.hidden = true;

      const nxaVNew = document.getElementById('nxaVNew');
      if (nxaVNew) {
        nxaVNew.hidden = false;
        nxaVNew.style.display = 'block';
      }

      const emChip = document.getElementById('nxlNwEm');
      if (emChip) emChip.textContent = session.email + '  ·  verified by Google';

      // Full name: pre-filled from the student's own college record (or from
      // what they already had saved), still editable, and checked server-side.
      const nameInput = document.getElementById('nxlName');
      if (nameInput) {
        nameInput.value = saved.name || record.name || '';
        nameInput.removeAttribute('readonly');
      }
      // USN and date of birth are typed by the student: that is the step that
      // proves the college record is theirs.
      const usnInput = document.getElementById('nxlUsn');
      if (usnInput) usnInput.value = saved.usn || '';
      const dobInput = document.getElementById('nxlDob');
      if (dobInput) {
        dobInput.value = saved.dob || '';
        dobInput.max = new Date().toISOString().split('T')[0];
      }

      const titleEl = authModal && authModal.querySelector('h3');
      if (titleEl) titleEl.textContent = 'Complete your registration';
      const subEl = document.getElementById('nxaSub');
      if (subEl) subEl.textContent = 'Your college email is verified. Confirm your college details to continue.';

      const btn = document.getElementById('nxlNwBtn');
      if (btn) { btn.disabled = false; btn.textContent = 'Continue'; }

      const s1 = document.getElementById('nxlS1');
      const s2 = document.getElementById('nxlS2');
      if (s1) s1.hidden = false;
      if (s2) s2.hidden = true;
      const bk = document.getElementById('nxlBk');
      if (bk) bk.hidden = true;
      const p2 = document.getElementById('nxlP2');
      if (p2) p2.className = '';
      const stepLbl = document.getElementById('nxlStepLbl');
      if (stepLbl) stepLbl.textContent = 'Step 1 of 2 · College details';

      if (nameInput) setTimeout(() => nameInput.focus(), 60);
    }
    window.openGoogleStudentOnboarding = openGoogleStudentOnboarding;

    // Step switching helper
    window.nxlStep = function (n) {
      const s1 = document.getElementById('nxlS1');
      const s2 = document.getElementById('nxlS2');
      const bk = document.getElementById('nxlBk');
      const p2 = document.getElementById('nxlP2');
      const stepLbl = document.getElementById('nxlStepLbl');
      const authModal = document.getElementById('authModal');
      const h3 = authModal && authModal.querySelector('h3');
      const sub = document.getElementById('nxaSub');
      const btn = document.getElementById('nxlNwBtn');

      if (n === 1) {
        if (s1) s1.hidden = false;
        if (s2) s2.hidden = true;
        if (bk) bk.hidden = true;
        if (p2) p2.className = '';
        if (stepLbl) stepLbl.textContent = 'Step 1 of 2 · College details';
        if (h3) h3.textContent = 'Complete your registration';
        if (sub) sub.textContent = 'Your college email is verified. Confirm your college details to continue.';
        if (btn) btn.textContent = 'Continue';
      } else if (n === 2) {
        if (s1) s1.hidden = true;
        if (s2) s2.hidden = false;
        if (bk) bk.hidden = false;
        if (p2) p2.className = 'on';
        if (stepLbl) stepLbl.textContent = 'Step 2 of 2 · About you';
        if (h3) h3.textContent = 'Make it yours';
        if (sub) sub.textContent = 'What should we call you, a short introduction, and the reading-interest quiz.';
        if (btn) btn.textContent = 'Finish and open BookNexus';
        renderReadingQuizOnPage3();
      }
    };

    const origNxlBack = window.nxlBack;
    window.nxlBack = function () {
      window.__googleOnboardingData = null;
      if (typeof origNxlBack === 'function') origNxlBack.apply(this, arguments);
    };

    // Sign a returning student in and open the home page.
    function enterSignedInStudent(u, welcome) {
      authToken = u.token;
      localStorage.setItem('booknexus_token', u.token);
      localStorage.setItem('currentUser', JSON.stringify(u));

      const studentUsn = u.usn || '';
      if (!window.NX_COLLEGE) window.NX_COLLEGE = {};
      if (studentUsn) {
        window.NX_COLLEGE[studentUsn] = {
          usn: studentUsn,
          name: u.name,
          email: u.email,
          dept: u.branch || '',
          branch: u.branch || '',
          semester: u.semester || '',
          college: u.college || '',
          phone: u.mobile || '',
          dob: u.dob || '',
          secretId: u.preferredName || String(u.name || '').split(' ')[0]
        };
        if (typeof window.nxLinkUSN === 'function') window.nxLinkUSN(window.NX_COLLEGE[studentUsn]);
      }

      currentUser = {
        name: u.name,
        rollNo: studentUsn,
        email: u.email,
        dept: u.branch || '',
        year: u.semester || '',
        phone: u.mobile || '',
        anonId: u.preferredName || String(u.name || '').split(' ')[0]
      };
      window.currentUser = currentUser;
      window.bnSessionUser = u;
      window.currentRole = 'student';

      if (typeof window.nxSessionSet === 'function') {
        window.nxSessionSet('student', studentUsn || u._id, u.name, u.email);
      }
      document.body.classList.remove('nx-guest');

      if (typeof setUserRole === 'function') setUserRole('student');
      if (typeof switchNav === 'function') switchNav('home');
      if (typeof renderNavLinks === 'function') renderNavLinks();
      if (typeof closeModal === 'function') closeModal('authModal');
      const authModal = document.getElementById('authModal');
      if (authModal) { authModal.classList.add('hidden'); authModal.style.display = ''; }

      const aLbl = document.getElementById('userAuthLabel');
      if (aLbl) aLbl.textContent = 'Sign out';
      const aBtn = document.getElementById('userAuthBtn');
      if (aBtn) aBtn.setAttribute('onclick', 'nxSignOut()');
      const pBtn = document.getElementById('profileBtn');
      if (pBtn) {
        const span = pBtn.querySelector('span:not(.material-symbols-outlined)');
        if (span) span.textContent = u.preferredName || String(u.name || '').split(' ')[0];
      }

      if (typeof gxRender === 'function') gxRender();
      if (typeof renderHomeShelf === 'function') renderHomeShelf();
      if (typeof renderHomeStats === 'function') renderHomeStats();
      if (typeof renderBookGrid === 'function') renderBookGrid();
      if (typeof window.updateNavProfile === 'function') window.updateNavProfile();
      if (typeof window.fetchLiveRentalsAndSync === 'function') window.fetchLiveRentalsAndSync();
      if (typeof window.fetchLiveTransactions === 'function') window.fetchLiveTransactions();

      if (typeof showToast === 'function' && welcome) showToast(welcome, 'success');
    }
    window.bnxEnterSignedInStudent = enterSignedInStudent;

    // Sign a librarian / admin in who used Google on an authorised staff account.
    function enterSignedInStaff(u) {
      authToken = u.token;
      localStorage.setItem('booknexus_token', u.token);
      localStorage.setItem('currentUser', JSON.stringify(u));
      window.bnSessionUser = u;
      window.currentRole = u.role;
      const staffId = u.role === 'admin' ? (u.adminId || 'ADMIN') : (u.librarianId || 'LIB');
      if (typeof window.nxSessionSet === 'function') window.nxSessionSet(u.role, staffId, u.name, u.email);
      document.body.classList.remove('nx-guest');
      if (typeof setUserRole === 'function') setUserRole(u.role);
      if (typeof closeModal === 'function') closeModal('authModal');
      const authModal = document.getElementById('authModal');
      if (authModal) { authModal.classList.add('hidden'); authModal.style.display = ''; }
      if (typeof showToast === 'function') showToast('Signed in as ' + u.name + ' (' + u.role + ')', 'success');
    }

    // ---- Google sign-in -> backend ---------------------------------------
    async function sendGoogleTokenToBackend(payload) {
      const banner = document.getElementById('nxaBanner');
      const showBanner = (msg, kind) => {
        if (!banner) return;
        banner.className = 'nxa-banner ' + (kind || 'bad');
        banner.textContent = msg;
        banner.hidden = false;
      };

      try {
        if (typeof showToast === 'function') showToast('Checking your college records…', 'info');

        // window.API_BASE is kept in sync with API_BASE at start-up; reading it
        // here lets the API host be repointed at runtime (e.g. a backend on a
        // different port during testing) without reloading the page.
        const apiBase = window.API_BASE || API_BASE;
        const res = await fetch(`${apiBase}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        // Not in college records (or any other refusal): no account is created,
        // no token is issued, and the student stays on the sign-in screen.
        if (!res.ok || !data.success) {
          const msg = (data && data.message) || `Google sign-in failed (HTTP ${res.status}).`;
          if (typeof window.nxaView === 'function') window.nxaView('ch', true);
          showBanner(msg, 'bad');
          const el = document.getElementById('nxlGoogleE');
          if (el) { el.textContent = msg; el.hidden = false; }
          if (typeof showToast === 'function') showToast(msg, 'error');
          if (window.google && window.google.accounts && window.google.accounts.id) {
            try { window.google.accounts.id.disableAutoSelect(); } catch (e) { }
          }
          return;
        }

        const u = data.data || {};

        // Librarian / admin who signed in with Google on their staff account.
        if (u.role === 'admin' || u.role === 'librarian') {
          enterSignedInStaff(u);
          return;
        }

        // Authenticated student: straight to the original BookNexus home page directly!
        enterSignedInStudent(u, `Welcome back, ${u.preferredName || u.name}!`);
      } catch (err) {
        console.warn('Google backend auth error:', err.message);
        showBanner('Could not reach BookNexus to verify your college records. Please check your connection and try again.', 'bad');
        if (typeof showToast === 'function') showToast('Google sign-in error: ' + err.message, 'error');
      }
    }
  }

  // SIGN-OUT BEHAVIOUR
  window.nxSignOut = function () {
    authToken = null;
    window.__googleOnboardingData = null;
    localStorage.removeItem('booknexus_token');
    localStorage.removeItem('currentUser');
    sessionStorage.clear();
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try { window.google.accounts.id.disableAutoSelect(); } catch (e) { }
    }
    document.body.classList.add('nx-guest');
    currentUser = {
      name: "Guest Student",
      rollNo: "",
      email: "",
      dept: "",
      year: "",
      phone: "",
      anonId: "Guest"
    };
    window.currentUser = currentUser;

    const aLbl = document.getElementById('userAuthLabel');
    if (aLbl) aLbl.textContent = 'Sign In';
    const aBtn = document.getElementById('userAuthBtn');
    if (aBtn) aBtn.setAttribute('onclick', "openModal('authModal')");
    const pBtn = document.getElementById('profileBtn');
    if (pBtn) {
      const span = pBtn.querySelector('span:not(.material-symbols-outlined)');
      if (span) span.textContent = 'Profile';
    }

    liveRentals = [];
    liveTransactions = [];
    window.transactionsList = [];
    clearDashboardUi();

    if (typeof setUserRole === 'function') setUserRole('student');
    if (typeof switchNav === 'function') switchNav('home');
    if (typeof showToast === 'function') showToast('You have signed out.', 'info');
  };

  // ======================================================================
  // TWO-STEP FIRST-TIME REGISTRATION (Google-verified students only)
  //
  // Step 1  full name + USN + date of birth, checked by the server against
  //         the student's approved college record.
  // Step 2  preferred name + short introduction + reading-interest quiz.
  //
  // Both requests authenticate with the 30-minute registration token that
  // POST /api/auth/google issued after verifying the Google ID token and
  // finding the email in college records. No email is ever sent in the body,
  // and no BookNexus password is asked for at any point.
  // ======================================================================
  window.nxlCreate = async function (e) {
    if (e && e.preventDefault) e.preventDefault();

    const session = window.__googleOnboardingData;
    const form = document.getElementById('nxaVNew');
    const banner = document.getElementById('nxaBanner');

    const fieldErr = (id, msg) => {
      const err = document.getElementById(id + 'E');
      if (err) { err.textContent = msg; err.hidden = false; }
      const input = document.getElementById(id);
      if (input) { input.setAttribute('aria-invalid', 'true'); input.focus(); }
      return false;
    };
    const showBanner = (msg, kind) => {
      if (!banner) return;
      banner.className = 'nxa-banner ' + (kind || 'bad');
      banner.textContent = msg;
      banner.hidden = false;
    };
    const clearErrs = () => {
      if (!form) return;
      form.querySelectorAll('.nxa-err').forEach(p => { p.hidden = true; p.textContent = ''; });
      form.querySelectorAll('[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
      if (banner) { banner.hidden = true; banner.textContent = ''; }
    };
    const fieldFor = name => ({ name: 'nxlName', usn: 'nxlUsn', dob: 'nxlDob', preferredName: 'nxlNick', bio: 'nxlBio', quizAnswers: 'nxlGen' }[name] || null);

    clearErrs();

    if (!session || !session.onboardingToken) {
      showBanner('Your registration session has expired. Please continue with Google again.', 'bad');
      if (typeof window.nxaView === 'function') window.nxaView('ch', true);
      return;
    }

    const s1 = document.getElementById('nxlS1');
    const isStep1 = s1 && !s1.hidden;
    const btn = document.getElementById('nxlNwBtn');
    const origText = btn ? btn.textContent : 'Continue';

    const post = async (path, payload) => {
      const res = await fetch(`${window.API_BASE}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.onboardingToken}`
        },
        body: JSON.stringify(payload)
      });
      const json = await res.json().catch(() => ({}));
      return { res, json };
    };

    // ---------------- STEP 1: college details ----------------
    if (isStep1) {
      const nameEl = document.getElementById('nxlName');
      const usnEl = document.getElementById('nxlUsn');
      const dobEl = document.getElementById('nxlDob');

      const name = nameEl ? nameEl.value.trim().replace(/\s+/g, ' ') : '';
      const usn = usnEl ? usnEl.value.replace(/\s+/g, '').toUpperCase() : '';
      if (usnEl) usnEl.value = usn;
      const dob = dobEl ? dobEl.value.trim() : '';

      if (!name || name.length < 2) return fieldErr('nxlName', 'Enter your full name as it appears in college records.');
      if (!usn) return fieldErr('nxlUsn', 'Enter your USN.');
      if (!dob) return fieldErr('nxlDob', 'Enter your date of birth.');
      if (dob > new Date().toISOString().split('T')[0]) return fieldErr('nxlDob', 'Date of birth cannot be in the future.');

      if (btn) { btn.disabled = true; btn.textContent = 'Checking college records…'; }
      try {
        const { res, json } = await post('/auth/onboarding/verify-identity', { name, usn, dob });
        if (!res.ok || !json.success) {
          const target = fieldFor(json.field);
          const msg = json.message || `Could not verify your college details (HTTP ${res.status}).`;
          if (target) fieldErr(target, msg); else showBanner(msg, 'bad');
          return;
        }

        session.name = json.data && json.data.name ? json.data.name : name;
        session.usn = json.data && json.data.usn ? json.data.usn : usn;
        session.dob = dob;
        if (nameEl && session.name) nameEl.value = session.name;

        window.nxlStep(2);

        const nickEl = document.getElementById('nxlNick');
        if (nickEl && !nickEl.value.trim()) nickEl.value = session.name.split(' ')[0] || '';

        const modalBody = form && (form.closest('.overflow-y-auto') || form);
        if (modalBody && modalBody.scrollTo) modalBody.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        console.error('Identity verification error:', err);
        showBanner('Could not reach BookNexus to check your college details. Please try again.', 'bad');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = origText; }
      }
      return;
    }

    // ---------------- STEP 2: about you + quiz ----------------
    const nickEl = document.getElementById('nxlNick');
    const bioEl = document.getElementById('nxlBio');
    const nick = nickEl ? nickEl.value.trim().replace(/\s+/g, ' ') : '';
    const bio = bioEl ? bioEl.value.trim() : '';

    if (!nick || nick.length < 2) return fieldErr('nxlNick', 'Please tell us what we should call you.');
    if (!bio || bio.length < 3) return fieldErr('nxlBio', 'Please write a short introduction about yourself.');

    const quizAnswers = window.__googleQuizAnswers || {};
    const totalQuestions = (typeof window.bnxQuizLength === 'number' && window.bnxQuizLength) || 6;
    const missing = [];
    for (let i = 0; i < totalQuestions; i++) {
      const a = quizAnswers[i];
      if (!Array.isArray(a) || !a.length) missing.push(i + 1);
    }
    if (missing.length) {
      const err = document.getElementById('nxlGenE');
      const msg = 'Please answer every quiz question. Still to answer: Q' + missing.join(', Q') + '.';
      if (err) { err.textContent = msg; err.hidden = false; }
      const box = document.getElementById('nxlGen');
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = 'Saving your profile…'; }
    try {
      const { res, json } = await post('/auth/complete-onboarding', {
        name: session.name,
        usn: session.usn,
        dob: session.dob,
        preferredName: nick,
        bio: bio,
        quizAnswers: quizAnswers
      });

      if (!res.ok || !json.success) {
        const msg = json.message || `Registration could not be saved (HTTP ${res.status}).`;
        if (json.step === 1) {
          window.nxlStep(1);
          const target = fieldFor(json.field);
          if (target) fieldErr(target, msg); else showBanner(msg, 'bad');
        } else {
          const target = fieldFor(json.field);
          if (target && target !== 'nxlGen') fieldErr(target, msg);
          else if (target === 'nxlGen') {
            const err = document.getElementById('nxlGenE');
            if (err) { err.textContent = msg; err.hidden = false; }
          } else showBanner(msg, 'bad');
        }
        if (typeof showToast === 'function') showToast(msg, 'error');
        return;
      }

      const user = json.data;
      window.__googleOnboardingData = null;
      window.__googleQuizAnswers = {};

      if (typeof window.bnxEnterSignedInStudent === 'function') {
        window.bnxEnterSignedInStudent(user, `Welcome to BookNexus, ${user.preferredName || user.name}!`);
      } else {
        localStorage.setItem('booknexus_token', user.token);
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (typeof closeModal === 'function') closeModal('authModal');
        window.location.reload();
      }
    } catch (err) {
      console.error('Onboarding submission error:', err);
      showBanner('Could not reach BookNexus to save your registration. Please try again.', 'bad');
      if (typeof showToast === 'function') showToast('Could not reach the BookNexus server. Please try again.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = origText; }
    }
  };

  // Fallback for the branded button: it only shows when Google's own rendered
  // button could not be drawn (for example third-party cookies / FedCM blocked).
  // One Tap also returns a verified ID token, so the backend contract is the same.
  async function openGoogleSignIn() {
    if (typeof clearGoogleError === 'function') clearGoogleError();

    // 1. Primary path: trigger Google OAuth account chooser popup directly
    if (tokenClient) {
      try {
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (e) {
        console.warn('tokenClient request error:', e);
      }
    }

    // 2. Secondary path: Google One Tap prompt
    if (window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.prompt((notification) => {
          if (!notification) return;
          const skipped = typeof notification.isSkippedMoment === 'function' && notification.isSkippedMoment();
          const dismissed = typeof notification.isNotDisplayed === 'function' && notification.isNotDisplayed();
          if (dismissed || skipped) {
            if (tokenClient) {
              tokenClient.requestAccessToken({ prompt: 'select_account' });
            } else if (typeof googleError === 'function') {
              googleError('Google could not open the account chooser. Please check pop-up settings.');
            }
          }
        });
        return;
      } catch (err) {
        console.warn('Google prompt error:', err.message);
      }
    }

    if (typeof googleError === 'function') {
      googleError('Google sign-in is initializing. Please try again in a moment.');
    }
    if (typeof initGoogleAuth === 'function') initGoogleAuth();
  }
  window.openGoogleSignIn = openGoogleSignIn;
  window.startGoogleOAuth = openGoogleSignIn;

  // Phone sign-in was removed: students sign in with Google only.
  window.nxlSocial = function () { openGoogleSignIn(); };
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
        } catch (e) { }
      }
      if (rec && rec.token) {
        authToken = rec.token;
        localStorage.setItem('booknexus_token', authToken);
        return origFinishStudent.apply(this, arguments);
      }
      // The old fallback here signed a student in by POSTing /auth/login with
      // their USN as the password (the roster import had seeded it that way).
      // That is removed: a student session only ever comes from a verified
      // Google sign-in, which already supplies rec.token above.
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
        btn.className = `p-2 rounded-xl text-xs text-left transition-all border flex items-center gap-2 ${isSelected
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

  // RETIRED: student USN + password sign-in. The form it drove was removed and
  // the backend now refuses password sign-in for students, so this only ever
  // sends people to the Google button.
  window.nxaDoIn = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    if (typeof window.nxaView === 'function') window.nxaView('ch');
    if (typeof showToast === 'function') showToast('Students sign in with Continue with Google.', 'info');
  };

  // RETIRED: student self sign-up. Accounts are created only by the
  // Google-verified, college-roster-checked registration flow.
  window.nxaDoUp = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    if (typeof window.nxaView === 'function') window.nxaView('ch');
    if (typeof showToast === 'function') showToast('Student accounts are created with Continue with Google.', 'info');
  };

  // RETIRED: the old standalone onboarding form. Onboarding now runs inside the
  // sign-in window (window.nxlCreate) against the registration token.
  window.nxaDoOnboard = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    if (typeof window.nxaView === 'function') window.nxaView('ch');
  };

  // Staff role-login is handled centrally by window.nxaDoSt connected to /api/auth/role-login
  // (no stray brace here: this used to close the bridge IIFE 1100 lines early,
  //  which made the whole of js/bridge.js a syntax error, so none of the
  //  backend integration below ever ran.)

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

window.closeCampusUpiModal = function () {
  const modal = document.getElementById('campusUpiModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
};

window.copyCampusUpiId = function () {
  const vpa = document.getElementById('upiModalPayeeVpa')?.textContent || '';
  if (vpa && navigator.clipboard) {
    navigator.clipboard.writeText(vpa);
    if (typeof showToast === 'function') showToast('Campus UPI ID copied: ' + vpa, 'success');
  }
};

window.openCampusUpiPayModal = async function (opts = {}) {
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

window.submitCampusUpiUtr = async function () {
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

window.librarianVerifyPayment = async function (transactionRef, amount) {
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

window.librarianRejectPayment = async function (transactionRef) {
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

// Keeps the rental list other panels read from, then defers every dashboard
// number to the one authoritative /analytics/user-dashboard response.
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
    }
  } catch (err) {
    console.warn('Live rentals fetch notice:', err.message);
  }

  await bnLoadDashboard(true);
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
  }
  // Mounted as a sibling of #dashboardHost: the dashboard rewrites its own
  // innerHTML on every filter change, which used to delete this panel.
  const mount = host.parentNode || host;
  if (trackerEl.parentNode !== mount) mount.insertBefore(trackerEl, host);

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
              <div class="text-xl font-extrabold text-brand-rosewood dark:text-white">${stats.ledgerTotal || 0}</div>
              <p class="text-[10px] text-gray-500">Verified receipts &amp; statement history</p>
            </div>
            <button type="button" onclick="if(typeof switchNav==='function')switchNav('transactions');" class="w-full py-1 px-2 rounded-lg bg-brand-rosewood text-white text-[10px] font-bold hover:bg-brand-rosewoodHover flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-xs">receipt_long</span> View Ledger
            </button>
          </div>
        </div>
        ${(stats.hasActivity === false) ? `
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
window.previewReceipt = function (txnId) {
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


/* ==========================================================================
   STUDENT DASHBOARD DATA
   Every figure on the dashboard comes from the signed-in student's own
   MongoDB records, fetched once from GET /api/analytics/user-dashboard and
   handed to the dashboard renderer. Nothing is derived from sample data, and
   no number is painted until the request has actually resolved.
   ========================================================================== */

const DASH_DAY = 86400000;
let dashboardRequest = null;
let dashboardData = null;

const dAgo = v => (v ? (Date.now() - new Date(v).getTime()) / DASH_DAY : null);
const dAhead = v => (v ? (new Date(v).getTime() - Date.now()) / DASH_DAY : null);
const d1 = n => Math.round(n * 10) / 10;

function borrowStage(rec) {
  switch (rec.group) {
    case 'pending': return ['Requested', 'Awaiting owner approval'];
    case 'cancelled': return ['Cancelled', 'Request declined'];
    case 'approved': return rec.pickedUp
      ? ['Return Due', 'Book is with you']
      : ['Ready for Pickup', 'Collect within the pickup window'];
    case 'active': return ['Return Due', 'Book is with you'];
    case 'returned': return ['Returned', rec.depositState === 'pend' ? 'Returned · deposit release pending' : 'Returned'];
    case 'completed': return ['Completed', 'Returned'];
    default: return ['In progress', ''];
  }
}

function lendStage(rec) {
  switch (rec.group) {
    case 'pending': return ['Request Received', '—', '—'];
    case 'cancelled': return ['Cancelled', 'Declined', '—'];
    case 'approved': return rec.pickedUp
      ? ['Dropped Off', 'Dropped off', 'Awaiting borrower pickup']
      : ['Awaiting Drop-off', 'You must drop off the book', 'Not yet rented'];
    case 'active': return ['Rented', 'Dropped off', 'With the borrower'];
    case 'returned': return ['Return Pending', 'Dropped off', 'Return verification pending'];
    case 'completed': return ['Completed', 'Dropped off', 'Returned'];
    default: return ['In progress', '—', '—'];
  }
}

function toDashRental(rec) {
  const out = {
    id: rec.id, role: rec.role, t: rec.title, a: rec.author, d: rec.dept, w: rec.counterparty,
    rent: rec.rentalFee || 0, dep: rec.depositAmount || 0, g: rec.group,
    s: Math.max(0, d1(dAgo(rec.requestDate) || 0)),
    ds: rec.depositState || 'none',
    pay: rec.paid ? 1 : 0
  };
  if (rec.returnDate) out.e = Math.max(0, d1(dAgo(rec.returnDate)));
  if (rec.depositRetained) { out.ret = rec.depositRetained; out.why = 'Late return · fine kept from the deposit'; }
  if (rec.finePaid) out.fine = rec.finePaid;
  if (rec.fineOutstanding) out.out = rec.fineOutstanding;

  if (rec.role === 'B') {
    const st = borrowStage(rec);
    out.stage = st[0]; out.rt = st[1];
    if (rec.pickedUp) out.pick = 1;
    if (rec.dueDate && !rec.returnDate) {
      out.due = d1(dAhead(rec.dueDate));
      out.rt = out.due >= 0
        ? 'Return due in ' + Math.max(0, Math.round(out.due)) + ' day(s)'
        : 'Overdue by ' + Math.round(-out.due) + ' day(s)';
    }
    if (out.stage === 'Ready for Pickup') out.win = Math.max(0.1, d1(3 - (dAgo(rec.approvedDate) || 0)));
  } else {
    const st = lendStage(rec);
    out.stage = st[0]; out.dr = st[1]; out.rt = st[2];
    out.earn = rec.earned ? 1 : 0;
    if (out.stage === 'Awaiting Drop-off') out.dl = Math.max(0.1, d1(2 - (dAgo(rec.approvedDate || rec.requestDate) || 0)));
    if (out.stage === 'Dropped Off') out.win = Math.max(0.1, d1(3 - (dAgo(rec.approvedDate) || 0)));
    if (rec.dueDate && !rec.returnDate) out.due = d1(dAhead(rec.dueDate));
  }
  return out;
}

function toDashLibrary(rec) {
  const out = {
    id: rec.id, t: rec.title, a: rec.author, d: rec.dept,
    s: Math.max(0, d1(dAgo(rec.borrowedDate) || 0))
  };
  if (rec.dueDate) out.due = d1(dAgo(rec.dueDate));
  if (rec.returnDate) out.e = Math.max(0, d1(dAgo(rec.returnDate)));
  if (rec.finePaid) out.fine = rec.finePaid;
  if (rec.fineOutstanding) out.out = rec.fineOutstanding;
  return out;
}

function buildTrackerStats(data) {
  const s = data.summary || {};
  const borrowed = (data.rentals && data.rentals.borrowed) || [];
  const lent = (data.rentals && data.rentals.lent) || [];
  const txns = data.transactions || [];
  const has = st => r => st.includes(r.status);

  const activeList = borrowed.filter(has(['active', 'received', 'approved', 'overdue']));
  const latest = activeList[0];
  const overdue = borrowed.filter(r => r.status === 'overdue' || (r.dueDate && !r.returnDate && new Date(r.dueDate) < new Date()));
  const overdueDays = overdue.reduce((max, r) => {
    if (!r.dueDate) return max;
    const d = Math.floor((Date.now() - new Date(r.dueDate).getTime()) / DASH_DAY);
    return d > max ? d : max;
  }, 0);

  return {
    borrowTotal: borrowed.length,
    borrowPending: borrowed.filter(has(['requested', 'pending'])).length,
    borrowApproved: borrowed.filter(has(['approved', 'active', 'received', 'overdue', 'returned', 'completed'])).length,
    borrowRejected: borrowed.filter(has(['rejected'])).length,
    activeRentalsCount: activeList.length,
    latestActiveBook: (latest && latest.book && latest.book.title) || '',
    latestDueDate: latest && latest.dueDate ? new Date(latest.dueDate).toLocaleDateString('en-IN') : '',
    returnsTotal: borrowed.filter(has(['returned', 'completed'])).length + lent.filter(has(['returned', 'completed'])).length,
    returnsRequested: borrowed.filter(has(['returned'])).length,
    returnsApproved: lent.filter(has(['returned'])).length,
    returnsCompleted: borrowed.filter(has(['completed'])).length + lent.filter(has(['completed'])).length,
    overdueDays: Math.max(0, overdueDays),
    totalPenaltyAmount: s.outstandingFines || 0,
    overdueBookTitle: (overdue[0] && overdue[0].book && overdue[0].book.title) || 'Library Book',
    paymentsTotal: txns.length,
    payInitiated: txns.filter(t => t.status === 'initiated').length,
    payPending: txns.filter(t => t.status === 'pending').length,
    paySuccessful: txns.filter(t => t.status === 'successful').length,
    ledgerTotal: txns.length,
    hasActivity: data.hasActivity === true
  };
}

function clearDashboardUi() {
  dashboardData = null;
  window.bnDashboardData = null;
  window.bnSessionUser = null;
  const el = document.getElementById('campusLifecycleTrackerHost');
  if (el && el.parentNode) el.parentNode.removeChild(el);
  if (window.NDX && typeof window.NDX.setState === 'function') window.NDX.setState('signedout');
}

async function bnLoadDashboard(force) {
  const token = getAuthToken();
  if (!token) { clearDashboardUi(); return null; }
  if (dashboardRequest && !force) return dashboardRequest;

  if (window.NDX && typeof window.NDX.setState === 'function' && (force || !dashboardData)) {
    window.NDX.setState('loading');
  }

  dashboardRequest = (async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics/user-dashboard`, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      if (res.status === 401) throw new Error('Your session has expired. Please sign in again.');
      let json = null;
      try { json = await res.json(); } catch (e) { json = null; }
      if (!res.ok || !json || !json.success || !json.data) {
        throw new Error((json && json.message) || ('The dashboard service replied with HTTP ' + res.status + '.'));
      }

      const data = json.data;
      dashboardData = data;
      window.bnDashboardData = data;

      const recs = data.records || { rentals: [], library: [] };
      if (window.NDX && typeof window.NDX.setData === 'function') {
        window.NDX.setData((recs.rentals || []).map(toDashRental), (recs.library || []).map(toDashLibrary));
      }
      renderStudentDashboardTracker(buildTrackerStats(data));
      return data;
    } catch (err) {
      console.warn('Dashboard load failed:', err.message);
      if (window.NDX && typeof window.NDX.setState === 'function') window.NDX.setState('error', err.message);
      return null;
    } finally {
      dashboardRequest = null;
    }
  })();

  return dashboardRequest;
}

window.bnLoadDashboard = bnLoadDashboard;
window.bnClearDashboard = clearDashboardUi;

function hookDashboardNav() {
  const orig = window.switchNav;
  if (typeof orig !== 'function' || window.__bnDashNavHooked) return;
  window.__bnDashNavHooked = true;
  window.switchNav = function (key) {
    const out = orig.apply(this, arguments);
    if (key === 'dashboard') bnLoadDashboard(true);
    return out;
  };
}

function initCampusPaymentSystem() {
  ensureCampusUpiModal();
  hookPayFineButtons();
  hookDashboardNav();
  setTimeout(async () => {
    await fetchLiveTransactions();
    await fetchLiveRentalsAndSync();
  }, 600);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setupRealData();
    hookAuth();
    hookRentalBlockchain();
    hookEmailNotifications();
    initCampusPaymentSystem();
    if (typeof window.initGoogleAuth === 'function') window.initGoogleAuth();
    if (typeof window.updateNavProfile === 'function') window.updateNavProfile();
    if (typeof renderHomeHero === 'function') renderHomeHero();
    if (typeof renderHomeShelf === 'function') renderHomeShelf();
    if (typeof gxRender === 'function') gxRender();
  });
} else {
  setupRealData();
  hookAuth();
  hookRentalBlockchain();
  hookEmailNotifications();
  initCampusPaymentSystem();
  if (typeof window.initGoogleAuth === 'function') window.initGoogleAuth();
  if (typeof window.updateNavProfile === 'function') window.updateNavProfile();
  if (typeof renderHomeHero === 'function') renderHomeHero();
  if (typeof renderHomeShelf === 'function') renderHomeShelf();
  if (typeof gxRender === 'function') gxRender();
}
}) ();
