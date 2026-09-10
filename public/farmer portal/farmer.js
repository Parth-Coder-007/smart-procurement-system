/* =========================================
   CENTRE DATA
========================================= */

const centres = {

    mumbai: [
        "Mumbai Central Procurement Centre",
        "Sion Procurement Centre",
        "Kurla Procurement Centre",
        "Mulund Procurement Centre"
    ],

    thane: [
        "Thane Central Procurement Centre",
        "Bhiwandi Procurement Centre",
        "Kalyan Procurement Centre",
        "Dombivli Procurement Centre",
        "Ulhasnagar Procurement Centre"
    ]

};


/* =========================================
   GLOBAL DATA
========================================= */

let registrationData = null;
let procurementData = null;


/* =========================================
   PAGE NAVIGATION
========================================= */

function showPage(pageId, clickedButton) {

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add("active-page");
    }

    document.querySelectorAll(".nav-btn").forEach(button => {
        button.classList.remove("active");
    });

    if (clickedButton) {
        clickedButton.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function openPage(pageId) {

    const button = [...document.querySelectorAll(".nav-btn")]
        .find(btn =>
            btn.getAttribute("onclick")?.includes(`'${pageId}'`)
        );

    showPage(pageId, button);

}


/* =========================================
   GET FORM ELEMENTS
========================================= */

const district = document.getElementById("district");
const centre = document.getElementById("centre");
const slot = document.getElementById("slot");
const date = document.getElementById("date");
const slotMessage = document.getElementById("slotMessage");
const form = document.getElementById("registrationForm");


/* =========================================
   DISTRICT → CENTRE
========================================= */

if (district && centre) {

    district.addEventListener("change", function () {

        centre.innerHTML =
            `<option value="">Select Procurement Centre</option>`;

        if (!centres[this.value]) {
            return;
        }

        centres[this.value].forEach(function (name) {

            const option = document.createElement("option");

            option.value = name;
            option.textContent = name;

            centre.appendChild(option);

        });

        checkSlot();

    });

}


/* =========================================
   SLOT AVAILABILITY
========================================= */

if (centre && slot && date) {

    centre.addEventListener("change", checkSlot);
    slot.addEventListener("change", checkSlot);
    date.addEventListener("change", checkSlot);

}


function checkSlot() {

    if (!district || !centre || !date || !slot || !slotMessage) {
        return;
    }

    if (
        district.value === "" ||
        centre.value === "" ||
        date.value === "" ||
        slot.value === ""
    ) {

        slotMessage.textContent =
            "Select a centre, date and time slot to check availability.";

        slotMessage.style.background = "#eef2f6";
        slotMessage.style.color = "#555";

        return;

    }


    /* DEMO AVAILABILITY */

    const available = Math.random() > 0.2;


    if (available) {

        slotMessage.textContent =
            "✓ Slot Available — You can register for this time slot.";

        slotMessage.style.background = "#eef6ee";
        slotMessage.style.color = "#245b24";

    }

    else {

        slotMessage.textContent =
            "✕ This slot is currently full. Please select another slot.";

        slotMessage.style.background = "#fff0f0";
        slotMessage.style.color = "#a00000";

    }

}


/* =========================================
   REGISTRATION
========================================= */

if (form) {

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        const crop = document.getElementById("crop");
        const weight = document.getElementById("weight");


        if (
            !district ||
            !centre ||
            !crop ||
            !weight ||
            !date ||
            !slot ||
            district.value === "" ||
            centre.value === "" ||
            crop.value === "" ||
            weight.value === "" ||
            date.value === "" ||
            slot.value === ""
        ) {

            alert("Please complete all required fields.");
            return;

        }


        const registration = {

            district:
                district.options[district.selectedIndex].text,

            procurement_centre:
                centre.value,

            crop_type:
                crop.value,

            product_weight:
                weight.value,

            preferred_date:
                date.value,

            time_slot:
                slot.value

        };


        console.log("Sending registration:", registration);


        try {

            const response = await fetch("/farmer/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(registration)

            });


            const data = await response.json();


            if (!response.ok) {

                alert(data.message || "Registration failed.");
                return;

            }


            /* =========================================
               GET INITIAL QUEUE POSITION
            ========================================= */

            const initialPosition =
                Number(data.position || 1);


            /* =========================================
               CALCULATE ESTIMATED TIME ONLY ONCE
            ========================================= */

            const estimatedTime =
                calculateEstimatedTime(
                    registration.time_slot,
                    initialPosition
                );


            /* =========================================
               SAVE ESTIMATED TIME PERMANENTLY
               FOR THIS TOKEN
            ========================================= */

            localStorage.setItem(
                "estimatedTime_" + data.token,
                estimatedTime
            );


            /* =========================================
               SAVE REGISTRATION DATA
            ========================================= */

            registrationData = {

                token: data.token,

                district: registration.district,

                centre: registration.procurement_centre,

                crop: registration.crop_type,

                weight: registration.product_weight,

                date: registration.preferred_date,

                slot: registration.time_slot,

                position: initialPosition,

                total: data.total || 1,

                estimatedTime: estimatedTime

            };


            displayRegistration();

            updateQueue();

            updateStatus();


            document
                .getElementById("tokenResult")
                .classList.remove("hidden");


            document
                .getElementById("tokenResult")
                .scrollIntoView({
                    behavior: "smooth"
                });


            console.log(
                "Registration successful."
            );

            console.log(
                "Estimated time assigned:",
                estimatedTime
            );

        }

        catch (error) {

            console.log(
                "Registration error:",
                error
            );

            alert(
                "Server error. Please make sure Node.js and MySQL are running."
            );

        }

    });

}


/* =========================================
   DISPLAY TOKEN
========================================= */

function displayRegistration() {

    if (!registrationData) {
        return;
    }


    const tokenNumber =
        document.getElementById("tokenNumber");

    const resultCentre =
        document.getElementById("resultCentre");

    const resultCrop =
        document.getElementById("resultCrop");

    const resultWeight =
        document.getElementById("resultWeight");

    const resultSlot =
        document.getElementById("resultSlot");


    if (tokenNumber) {
        tokenNumber.textContent =
            registrationData.token;
    }

    if (resultCentre) {
        resultCentre.textContent =
            registrationData.centre;
    }

    if (resultCrop) {
        resultCrop.textContent =
            registrationData.crop;
    }

    if (resultWeight) {
        resultWeight.textContent =
            registrationData.weight + " kg";
    }

    if (resultSlot) {
        resultSlot.textContent =
            registrationData.slot;
    }

}


/* =========================================
   QUEUE MANAGEMENT
========================================= */

function updateQueue() {

    const noQueue =
        document.getElementById("noQueue");

    const queueDetails =
        document.getElementById("queueDetails");


    if (!registrationData) {

        if (noQueue) {
            noQueue.classList.remove("hidden");
        }

        if (queueDetails) {
            queueDetails.classList.add("hidden");
        }

        return;

    }


    if (noQueue) {
        noQueue.classList.add("hidden");
    }

    if (queueDetails) {
        queueDetails.classList.remove("hidden");
    }


    document.getElementById("queueToken").textContent =
        registrationData.token;


    document.getElementById("position").textContent =
        registrationData.position;


    document.getElementById("totalPeople").textContent =
        registrationData.total;


    document.getElementById("queueSlot").textContent =
        registrationData.slot;


    document.getElementById("queueDistrict").textContent =
        registrationData.district;


    document.getElementById("queueCentre").textContent =
        registrationData.centre;


    document.getElementById("queueCrop").textContent =
        registrationData.crop;


    document.getElementById("queueWeight").textContent =
        registrationData.weight + " kg";


    /* =========================================
       GET SAVED ESTIMATED TIME

       IMPORTANT:
       DO NOT RECALCULATE HERE.

       The estimated time was assigned when
       the farmer registered.

       Even if queue position changes later,
       estimated time remains the same.
    ========================================= */

    let estimated =
        registrationData.estimatedTime;


    /* =========================================
       RECOVER FROM LOCAL STORAGE
       IF NOT AVAILABLE IN registrationData
    ========================================= */

    if (!estimated) {

        estimated =
            localStorage.getItem(
                "estimatedTime_" +
                registrationData.token
            );

    }


    /* =========================================
       OLD REGISTRATION FALLBACK

       If this farmer registered before the
       new fixed-time system, calculate it once
       and save it.
    ========================================= */

    if (!estimated) {

        estimated =
            calculateEstimatedTime(
                registrationData.slot,
                registrationData.position
            );


        localStorage.setItem(
            "estimatedTime_" +
            registrationData.token,
            estimated
        );

    }


    registrationData.estimatedTime =
        estimated;


    const estimatedElement =
        document.getElementById("estimatedTime");


    if (estimatedElement) {

        estimatedElement.textContent =
            estimated;

    }


    /* =========================================
       QUEUE MESSAGE
    ========================================= */

    const message =
        document.querySelector(".queue-message p");


    if (message) {

        let positionText;

        if (registrationData.position === 1) {

            positionText = "1st";

        }

        else if (registrationData.position === 2) {

            positionText = "2nd";

        }

        else if (registrationData.position === 3) {

            positionText = "3rd";

        }

        else {

            positionText =
                registrationData.position + "th";

        }


        message.textContent =
            `You are currently ${positionText} in the queue. Please reach the centre around your estimated time.`;

    }


    /* =========================================
       QUEUE PROGRESS
    ========================================= */

    let progress = 0;


    if (registrationData.total > 0) {

        progress =
            (registrationData.position /
                registrationData.total) * 100;

    }


    const progressBar =
        document.querySelector(".queue-progress");


    if (progressBar) {

        progressBar.style.width =
            progress + "%";

    }

}


/* =========================================
   ESTIMATED TIME
========================================= */

function calculateEstimatedTime(slotText, position) {

    if (!slotText) {
        return "-";
    }


    /* =========================================
       GET GOVERNMENT SETTING

       Default = 10 minutes
    ========================================= */

    const timePerFarmer =
        Number(
            localStorage.getItem(
                "estimatedTimePerFarmer"
            )
        ) || 10;


    /* =========================================
       GET SLOT START TIME
    ========================================= */

    const startText =
        slotText.split("-")[0].trim();


    const parts =
        startText.split(" ");


    const time =
        parts[0];

    const period =
        parts[1];


    let [hours, minutes] =
        time.split(":").map(Number);


    if (
        period === "PM" &&
        hours !== 12
    ) {

        hours += 12;

    }


    if (
        period === "AM" &&
        hours === 12
    ) {

        hours = 0;

    }


    /* =========================================
       CALCULATE INITIAL ESTIMATED TIME

       Position 1 = slot start
       Position 2 = +1 × time
       Position 3 = +2 × time
       Position 4 = +3 × time

       Example:

       Slot = 10:00 AM - 11:00 AM
       Time per farmer = 10 minutes

       Position 1 = 10:00 AM
       Position 2 = 10:10 AM
       Position 3 = 10:20 AM
       Position 4 = 10:30 AM
    ========================================= */

    const waitingMinutes =
        Math.max(
            0,
            Number(position) - 1
        ) * timePerFarmer;


    let totalMinutes =
        hours * 60 +
        minutes +
        waitingMinutes;


    /* =========================================
       CONVERT TO 12-HOUR TIME
    ========================================= */

    let finalHours =
        Math.floor(
            totalMinutes / 60
        );


    const finalMinutes =
        totalMinutes % 60;


    const finalPeriod =
        finalHours >= 12
            ? "PM"
            : "AM";


    if (finalHours > 12) {
        finalHours -= 12;
    }


    if (finalHours === 0) {
        finalHours = 12;
    }


    return `${String(finalHours).padStart(2, "0")}:${String(finalMinutes).padStart(2, "0")} ${finalPeriod}`;

}


/* =========================================
   PROCESS STATUS
========================================= */

function updateStatus() {

    if (!registrationData) {

        document
            .getElementById("statusEmpty")
            .classList.remove("hidden");

        document
            .getElementById("statusCard")
            .classList.add("hidden");

        return;

    }


    document
        .getElementById("statusEmpty")
        .classList.add("hidden");


    document
        .getElementById("statusCard")
        .classList.remove("hidden");


    document.getElementById("statusToken").textContent =
        registrationData.token;

}


/* =========================================
   LOAD LOGGED-IN FARMER PROFILE
========================================= */

async function loadFarmerProfile() {

    try {

        const response =
            await fetch("/farmer/profile");


        if (!response.ok) {

            console.log(
                "Could not load farmer profile"
            );

            return;

        }


        const farmer =
            await response.json();


        console.log(
            "Logged-in farmer:",
            farmer
        );


        document.getElementById("farmerId").textContent =
            farmer.id;

        document.getElementById("farmerName").textContent =
            farmer.name;

        document.getElementById("farmerEmail").textContent =
            farmer.email;

        document.getElementById("farmerMobile").textContent =
            farmer.mobile;

        document.getElementById("farmerDistrict").textContent =
            farmer.district;

        document.getElementById("farmerVillage").textContent =
            farmer.village;

        document.getElementById("farmerLandArea").textContent =
            farmer.land_area;

    }

    catch (error) {

        console.log(
            "Profile loading error:",
            error
        );

    }

}


/* =========================================
   LOAD LIVE FARMER QUEUE
========================================= */

async function loadFarmerRegistration() {

    try {

        const response =
            await fetch("/farmer/api/queue");


        if (!response.ok) {

            console.log(
                "Could not load live queue"
            );

            return;

        }


        const data =
            await response.json();


        console.log(
            "Live queue:",
            data
        );


        /* =========================================
           NO REGISTRATION
        ========================================= */

        if (!data.registration) {

            registrationData = null;

            updateQueue();

            updateStatus();

            return;

        }


        const latest =
            data.registration;


        /* =========================================
           GET SAVED ESTIMATED TIME
        ========================================= */

        let savedEstimatedTime =
            localStorage.getItem(
                "estimatedTime_" +
                latest.token
            );


        /* =========================================
           IF NO SAVED TIME EXISTS

           This is mainly for an older registration
           created before this fixed-time system.

           Calculate it ONCE and save it.
        ========================================= */

        if (!savedEstimatedTime) {

            savedEstimatedTime =
                calculateEstimatedTime(
                    latest.time_slot,
                    Number(data.position || 1)
                );


            localStorage.setItem(
                "estimatedTime_" +
                latest.token,
                savedEstimatedTime
            );

        }


        /* =========================================
           CURRENT REGISTRATION DATA
        ========================================= */

        registrationData = {

            token:
                latest.token,

            district:
                latest.district,

            centre:
                latest.procurement_centre,

            crop:
                latest.crop_type,

            weight:
                latest.product_weight,

            date:
                latest.preferred_date,

            slot:
                latest.time_slot,

            /*
               Position remains LIVE.

               This can change when other farmers
               are processed.
            */

            position:
                Number(data.position || 0),

            total:
                Number(data.total || 0),

            /*
               Estimated time is FIXED.

               It is taken from localStorage.
               It is NOT recalculated every refresh.
            */

            estimatedTime:
                savedEstimatedTime

        };


        /* =========================================
           PROCUREMENT COMPLETED
        ========================================= */

        if (data.completed) {

            console.log(
                "This farmer's procurement is completed."
            );


            const queueDetails =
                document.getElementById("queueDetails");


            const noQueue =
                document.getElementById("noQueue");


            if (queueDetails) {

                queueDetails.classList.add("hidden");

            }


            if (noQueue) {

                noQueue.classList.remove("hidden");


                noQueue.innerHTML = `

                    <div>✓</div>

                    <h3>
                        Procurement Completed
                    </h3>

                    <p>
                        Your crop procurement has been completed.
                        Please check Process Status for payment details.
                    </p>

                    <button
                        class="primary-btn"
                        onclick="openPage('status')"
                    >
                        View Process Status
                    </button>

                `;

            }


            return;

        }


        /* =========================================
           ACTIVE QUEUE
        ========================================= */

        displayRegistration();

        updateQueue();

        updateStatus();


        const tokenResult =
            document.getElementById("tokenResult");


        if (tokenResult) {

            tokenResult.classList.remove("hidden");

        }

    }

    catch (error) {

        console.log(
            "Live queue loading error:",
            error
        );

    }

}


/* =========================================
   LOAD FARMER PROCUREMENT
========================================= */

async function loadFarmerProcurement() {

    try {

        const response =
            await fetch("/farmer/api/procurement");


        if (!response.ok) {

            console.log(
                "Could not load procurement details"
            );

            return;

        }


        const procurements =
            await response.json();


        console.log(
            "Farmer procurement:",
            procurements
        );


        /* =========================================
           NO PROCUREMENT
        ========================================= */

        if (
            !Array.isArray(procurements) ||
            procurements.length === 0
        ) {

            procurementData = null;


            const procurementCard =
                document.getElementById(
                    "procurementCard"
                );


            const procurementEmpty =
                document.getElementById(
                    "procurementEmpty"
                );


            if (procurementCard) {

                procurementCard.classList.add(
                    "hidden"
                );

            }


            if (procurementEmpty) {

                procurementEmpty.classList.remove(
                    "hidden"
                );

            }


            return;

        }


        /* =========================================
           GET LATEST PROCUREMENT
        ========================================= */

        procurementData =
            procurements[0];


        /* =========================================
           SHOW PROCUREMENT CARD
        ========================================= */

        const procurementCard =
            document.getElementById(
                "procurementCard"
            );


        const procurementEmpty =
            document.getElementById(
                "procurementEmpty"
            );


        if (procurementCard) {

            procurementCard.classList.remove(
                "hidden"
            );

        }


        if (procurementEmpty) {

            procurementEmpty.classList.add(
                "hidden"
            );

        }


        /* =========================================
           DISPLAY PROCUREMENT DATA
        ========================================= */

        document.getElementById(
            "procurementToken"
        ).textContent =
            "#" + procurementData.token;


        document.getElementById(
            "procurementCrop"
        ).textContent =
            procurementData.crop_type;


        document.getElementById(
            "procurementQuantity"
        ).textContent =
            procurementData.quantity + " kg";


        document.getElementById(
            "procurementAccepted"
        ).textContent =
            procurementData.accepted_quantity !== null &&
            procurementData.accepted_quantity !== undefined
                ? procurementData.accepted_quantity + " kg"
                : "-";


        document.getElementById(
            "procurementQuality"
        ).textContent =
            procurementData.quality_grade || "-";


        document.getElementById(
            "procurementTest"
        ).textContent =
            procurementData.test_result || "-";


        document.getElementById(
            "procurementRate"
        ).textContent =
            procurementData.rate_per_kg !== null &&
            procurementData.rate_per_kg !== undefined
                ? "₹" + procurementData.rate_per_kg
                : "-";


        document.getElementById(
            "procurementAmount"
        ).textContent =
            procurementData.total_amount !== null &&
            procurementData.total_amount !== undefined
                ? "₹" + procurementData.total_amount
                : "-";


        document.getElementById(
            "procurementPayment"
        ).textContent =
            procurementData.payment_status ||
            "Pending";


        document.getElementById(
            "procurementProcess"
        ).textContent =
            procurementData.procurement_status ||
            "Processing";


        document.getElementById(
            "procurementRemarks"
        ).textContent =
            procurementData.remarks ||
            "No remarks";


        /* =========================================
           UPDATE STATUS BADGE
        ========================================= */

        const badge =
            document.getElementById(
                "procurementStatusBadge"
            );


        if (badge) {

            badge.textContent =
                procurementData.procurement_status ||
                "Processing";

        }


        /* =========================================
           UPDATE PROCESS STATUS
        ========================================= */

        updateProcessTracker();

    }

    catch (error) {

        console.log(
            "Procurement loading error:",
            error
        );

    }

}


/* =========================================
   UPDATE PROCESS TRACKER
========================================= */

function updateProcessTracker() {

    if (!procurementData) {
        return;
    }


    const steps =
        document.querySelectorAll(
            ".process-step"
        );


    if (steps.length < 4) {
        return;
    }


    const procurementStatus =
        String(
            procurementData.procurement_status || ""
        ).toLowerCase();


    const paymentStatus =
        String(
            procurementData.payment_status || ""
        ).toLowerCase();


    /* =========================================
       CENTRE VISIT
    ========================================= */

    if (
        procurementStatus === "processing" ||
        procurementStatus === "completed"
    ) {

        steps[1].classList.add(
            "completed"
        );

        steps[1]
            .querySelector("small")
            .textContent =
            "Completed";

        steps[1]
            .querySelector(".circle")
            .textContent =
            "✓";

    }


    /* =========================================
       DEAL COMPLETED
    ========================================= */

    if (
        procurementStatus === "completed"
    ) {

        steps[2].classList.add(
            "completed"
        );

        steps[2]
            .querySelector("small")
            .textContent =
            "Completed";

        steps[2]
            .querySelector(".circle")
            .textContent =
            "✓";

    }


    /* =========================================
       PAYMENT
    ========================================= */

    if (
        paymentStatus === "completed" ||
        paymentStatus === "paid" ||
        paymentStatus === "successful"
    ) {

        steps[3].classList.add(
            "completed"
        );

        steps[3]
            .querySelector("small")
            .textContent =
            "Completed";

        steps[3]
            .querySelector(".circle")
            .textContent =
            "✓";


        document.getElementById(
            "currentStatus"
        ).textContent =
            "Procurement completed and payment successful.";

    }

    else if (
        procurementStatus === "completed"
    ) {

        document.getElementById(
            "currentStatus"
        ).textContent =
            "Procurement completed. Payment is pending.";

    }

    else {

        document.getElementById(
            "currentStatus"
        ).textContent =
            "Your crop is currently being processed at the procurement centre.";

    }

}


/* =========================================
   INITIAL LOAD
========================================= */

window.addEventListener(
    "load",
    function () {

        loadFarmerProfile();

        loadFarmerRegistration();

        loadFarmerProcurement();

    }
);


/* =========================================
   LIVE QUEUE REFRESH
========================================= */

setInterval(
    function () {

        loadFarmerRegistration();

        loadFarmerProcurement();

    },
    5000
);