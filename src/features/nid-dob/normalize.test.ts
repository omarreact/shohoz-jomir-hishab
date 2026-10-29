import { normalizeNidResponse } from "./normalize";

describe("normalizeNidResponse", () => {
  it("normalizes the sample-style payload without live identity data", () => {
    const result = normalizeNidResponse({
      status: "success",
      data: {
        nid_number: "1234567890",
        name_bn: "পরীক্ষা ব্যবহারকারী",
        name_en: "Test User",
        gender: "পুরুষ",
        dob: "05/07/1979",
        father_name: "পরীক্ষা পিতা",
        mother_name: "পরীক্ষা মাতা",
        present_address: {
          division: "ঢাকা",
          district: "ঢাকা",
          upazila: "উত্তরা",
          post_code: "1230",
        },
        permanent_address: {
          division: "ঢাকা",
          district: "ঢাকা",
        },
        photo_url: "https://example.gov.bd/photo.jpg",
      },
    });

    expect(result.nidNumber).toBe("1234567890");
    expect(result.dateOfBirth).toBe("1979-07-05");
    expect(result.presentAddress.postCode).toBe("1230");
    expect(result.photoUrl).toBe("https://example.gov.bd/photo.jpg");
  });

  it("normalizes a citizenData-style provider payload", () => {
    const result = normalizeNidResponse({
      citizenData: {
        citizen_nid: "1234567890123",
        fullName_English: "Test Citizen",
        fullName_Bangla: "টেস্ট সিটিজেন",
        dob: "1990-01-02",
        permanentHouseholdNo: {
          division: "ঢাকা",
          district: "নারায়ণগঞ্জ",
          upazilla: "সোনারগাঁও",
          unionOrWard: "বারদী",
          mouzaOrMoholla: "পাইকপাড়া",
          villageOrRoad: "চেঙ্গাকান্দি",
        },
      },
    });

    expect(result.nidNumber).toBe("1234567890123");
    expect(result.nameEn).toBe("Test Citizen");
    expect(result.permanentAddress.upazila).toBe("সোনারগাঁও");
    expect(result.permanentAddress.union).toBe("বারদী");
  });
});
