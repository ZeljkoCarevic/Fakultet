import { LightningElement, wire } from "lwc";
//import svih fieldova koje mi tribaju
import STUDENT_OBJECT from "@salesforce/schema/Student__c";
import IME_FIELD from "@salesforce/schema/Student__c.Name";
import PREZIME_FIELD from "@salesforce/schema/Student__c.Prezime__c";
import EMSO_FIELD from "@salesforce/schema/Student__c.EMSO__c";
import SMJER_FIELD from "@salesforce/schema/Student__c.Smjer__c";
import UPLATITELJ_FIELD from "@salesforce/schema/Student__c.Uplatitelj__c";

//za prikazivanje poruke
import { ShowToastEvent } from "lightning/platformShowToastEvent";
//za dodavanje rekorda
import { createRecord } from "lightning/uiRecordApi";
//za dobit vrjednosti picklista
import { getPicklistValues } from "lightning/uiObjectInfoApi";

export default class Student extends LightningElement {
  ime = "";
  prezime = "";
  emso = "";
  uplatitelj;
  smjer = "";
  StageValue = "";
  vanredni = "";

  @wire(getPicklistValues, {
    recordTypeId: "012000000000000AAA",
    fieldApiName: SMJER_FIELD
  })
  smjerPicklist;

  get options() {
    return [
      { label: "Redovni", value: "redovni" },
      { label: "Vanredni", value: "vanredni" }
    ];
  }

  handleChange(e) {
    if (e.target.label === "Ime") {
      this.ime = e.target.value;
    } else if (e.target.label === "Prezime") {
      this.prezime = e.target.value;
    } else if (e.target.label === "EMŠO") {
      this.emso = e.target.value;
    } else if (e.target.label === "Vrsta studija") {
      this.smjer = e.detail.value;
    } else if (e.target.label === "Uplatitelj") {
      this.uplatitelj = e.target.checked;
    }

    console.log(e.target);

    this.StageValue = e.detail.value;
    this.picklistVal = this.StageValue;

    if (this.picklistVal === "vanredni") {
      this.vanredni = this.StageValue;
    }
  }

  ///VALIDACIJA EMŠO POLJA

  poruka() {
    this.dispatchEvent(
      new ShowToastEvent({
        title: "Krivo!",
        message: "Krivi unos EMŠO",
        variant: "Error"
      })
    );
  }

  validateInput() {
    let tempdate;
    let date;
    let month;
    let year;
    let emsoSum;
    let controlDigit;

    if (this.emso.length < 13) {
      this.poruka();
    }

    //provjera prvih 7 polja
    const number = this.emso.substring(4, 5) > 0 ? 1 : 2;

    tempdate = new Date(
      number + this.emso.substring(4, 7),
      this.emso.substring(2, 4),
      this.emso.substring(0, 2)
    );

    date = tempdate.getDate();
    month = tempdate.getMonth();
    year = tempdate.getFullYear();

    console.log(date, month, year);

    if (
      !(year === number + this.emso.substring(4, 7)) &&
      month === this.emso.substring(2, 4) &&
      date === this.emso.substring(0, 2)
    ) {
      this.poruka();
    }

    //provjera konstatne vrjednosti
    if (this.emso.substring(7, 9) !== 50) {
      this.poruka();
    }

    //kontrolna suma

    for (let i = 7; i > 1; i--) {
      emsoSum +=
        i * (this.emso.substring(7 - i, 1), 2) + this.emso.substring(13 - i, 1);
    }

    controlDigit = emsoSum % 11 === 0 ? 0 : 11 - (emsoSum % 11);

    if (!(this.emso.substring(12, 1) === controlDigit)) {
      this.poruka();
    }
  }

  //trebao sam skinuti google chrome ekstenziju da bi radilo

  EMSOApi() {
    const calloutURI = "https://app.agilcon.com/job/emso.php?emso=EMSO";
    fetch(calloutURI, {
      method: "GET"
    })
      .then((response) => response.json())
      .then((repos) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: repos.title,
            message: repos.message,
            variant: "Error"
          })
        );
      });
  }

  dodajStudenta() {
    const fields = {};
    fields[IME_FIELD.fieldApiName] = this.ime;
    fields[PREZIME_FIELD.fieldApiName] = this.prezime;
    fields[EMSO_FIELD.fieldApiName] = this.emso;
    fields[SMJER_FIELD.fieldApiName] = this.smjer;
    fields[UPLATITELJ_FIELD.fieldApiName] = this.uplatitelj;

    const recordInput = { apiName: STUDENT_OBJECT.objectApiName, fields };

    createRecord(recordInput)
      .then((student) => {
        this.studentId = student.id;
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Uspješno",
            message: "Dodan student",
            variant: "Success"
          })
        );
      })
      .catch((err) => {
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Neuspješno",
            message: err.body.message,
            variant: "Fail"
          })
        );
      });
  }
}
