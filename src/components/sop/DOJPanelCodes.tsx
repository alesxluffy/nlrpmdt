import { useState } from 'react';
import { Search, Scale, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface PenalCode {
  code: string;
  title: string;
  description: string;
  jail: string | number;
  fine: string | number;
  flags?: string[];
}

const DOJ_PENAL_CODES: PenalCode[] = [
  // Crimes Against Persons (200s)
  { code: "P.C. 201", title: "Criminal Threat", description: "Intentionally puts another in the belief of physical harm or offensive contact.", jail: 10, fine: 300 },
  { code: "P.C. 202", title: "Assault and Battery", description: "Uses violence to cause physical harm to another person without a weapon.", jail: 20, fine: 800 },
  { code: "P.C. 203", title: "Aggravated Assault and Battery", description: "Uses violence to cause physical harm to another person with a weapon.", jail: 40, fine: 1000, flags: ["Seize"] },
  { code: "P.C. 203", title: "Second Degree Aggravated Assault and Battery", description: "A spontaneous act of violence using a deadly weapon or dangerous object to cause physical harm to another person, without premeditation or intent to kill.", jail: 40, fine: 1000, flags: ["Seize"] },
  { code: "P.C. 204", title: "Torture", description: "Causes extreme pain and suffering to another person.", jail: 70, fine: 1200, flags: ["Seize"] },
  { code: "P.C. 204", title: "First Degree Aggravated Assault and Battery", description: "A premeditated and deliberate attack on another person with the intent to cause serious harm or death, where the actions go beyond aggravated assault but do not result in a completed killing.", jail: 60, fine: 1500, flags: ["Seize"] },
  { code: "P.C. 205", title: "Terroristic Threat", description: "Intentionally puts another in the belief or fear of an act of terrorism happening.", jail: 30, fine: 1000, flags: ["Seize"] },
  { code: "P.C. 206", title: "Terrorism", description: "A violent, criminal act committed by a person to further goals stemming from political, religious, social, or environmental influences.", jail: "HUT", fine: "HUT", flags: ["Seize"] },
  { code: "P.C. 206", title: "Maiming", description: "The act of disabling, disfiguring, removing or permanently damaging a person's limbs (all extremities) either intentionally or in a fight.", jail: 350, fine: 4000, flags: ["Per", "Seize"] },
  { code: "P.C. 207", title: "Attempted Murder", description: "Attempts to perform a premeditated killing of another person with malice.", jail: 80, fine: 1500, flags: ["Seize"] },
  { code: "P.C. 208", title: "Involuntary Manslaughter", description: "Acted recklessly and negligently which resulted in the death of another person.", jail: "HUT", fine: "HUT", flags: ["Seize"] },
  { code: "P.C. 209", title: "Voluntary Manslaughter", description: "Acted in the heat of passion caused by being reasonably and strongly provoked which resulted in the death of another person.", jail: "HUT", fine: "HUT", flags: ["Seize"] },
  { code: "P.C. 210", title: "Second Degree Murder", description: "Performs a non-premeditated killing of another person, resulting from an assault where death was a possibility.", jail: "HUT", fine: "HUT", flags: ["Seize"] },
  { code: "P.C. 211", title: "First Degree Murder", description: "Performs a premeditated killing with malice.", jail: "HUT", fine: "HUT", flags: ["Seize"] },
  { code: "P.C. 212", title: "False Imprisonment", description: "A person who intentionally and unlawfully restrains, detains, or confines another person.", jail: 10, fine: 600 },
  { code: "P.C. 213", title: "Kidnapping", description: "Intentionally took another person from point A to point B without consent.", jail: 50, fine: 1000, flags: ["Seize"] },
  { code: "P.C. 214", title: "Fraudulent", description: "Fraudulent Fine 5000 + fraud amount", jail: 120, fine: 5000, flags: ["Seize"] },
  { code: "P.C. 214", title: "No Plate First Time", description: "Not having Number Plate First Time. 2 Day Seize", jail: 0, fine: 3000, flags: ["Seize"] },
  { code: "P.C. 215", title: "Destructive Use of Blasting Agents", description: "Intentionally using an incendiary/explosive device to cause harm to another person", jail: 85, fine: 2500, flags: ["Seize"] },
  { code: "P.C. 215", title: "No Plate Second Time", description: "Not having Number Plate Second Time. 4 Day Seize", jail: 0, fine: 6000, flags: ["Seize"] },

  // Crimes Against Property (300s)
  { code: "P.C. 301", title: "Loitering", description: "Fails to leave property when asked to do so by a relevant representative of the property.", jail: 10, fine: 250 },
  { code: "P.C. 302", title: "Trespassing", description: "Enters, or remains on land and fails to leave, which noted that entry was forbidden.", jail: 10, fine: 300 },
  { code: "P.C. 303", title: "Trespassing on Government Property", description: "Trespasses specifically on Government Property.", jail: 15, fine: 950 },
  { code: "P.C. 304", title: "Burglary", description: "The act of entering property with the intent to commit a crime. For vehicles specifically, this is known as Auto-Burglary.", jail: 25, fine: 600, flags: ["Seize"] },
  { code: "P.C. 305", title: "Robbery", description: "The unlawful taking of property from the person of another through the use of threat or force.", jail: 25, fine: 400, flags: ["Seize"] },
  { code: "P.C. 306", title: "Armed Robbery", description: "The unlawful taking of property from the person of another by the use of a weapon.", jail: 40, fine: 650, flags: ["Seize"] },
  { code: "P.C. 307", title: "Armed Robbery of a Shop", description: "The unlawful taking of property within a store with the use of a weapon.", jail: 40, fine: 1000, flags: ["Seize"] },
  { code: "P.C. 308", title: "Armed Robbery of a Bank", description: "The unlawful taking of property within a bank with the use of a weapon.", jail: 90, fine: 2000, flags: ["Seize"] },
  { code: "P.C. 309", title: "Armed Robbery of a Stockade", description: "The unlawful taking of property within a Stockade or armored vehicle with the use of a weapon.", jail: 120, fine: 2500, flags: ["Seize"] },
  { code: "P.C. 310", title: "Armed Robbery of a Jewellery Store", description: "The unlawful taking of property within a Jewellery Store with the use of a weapon.", jail: 150, fine: 3000, flags: ["Seize"] },
  { code: "P.C. 311", title: "Theft", description: "Takes personal property of another without permission or consent.", jail: 10, fine: 200, flags: ["Per"] },
  { code: "P.C. 312", title: "Grand Theft", description: "Taking the property of another illegally with the intent to deprive the owner of that property. Value exceeding $3000.", jail: 15, fine: 1000, flags: ["Per"] },
  { code: "P.C. 313", title: "Grand Theft Auto", description: "Taking the vehicle of another illegally with the intent to deprive the owner of that vehicle.", jail: 30, fine: 1000 },
  { code: "P.C. 314", title: "Destruction of Private Property", description: "Willful destruction or damaging of property in a manner that defaces, mars, or otherwise adds a physical blemish.", jail: 10, fine: 350 },
  { code: "P.C. 315", title: "Possession of Stolen Property", description: "Has possession of property not belonging to them and the owner has reported said items stolen.", jail: 10, fine: 350, flags: ["Per", "Seize"] },
  { code: "P.C. 316", title: "Receiving Stolen Property", description: "Individual has accepted possession of goods or property and knew they were stolen.", jail: 25, fine: 400 },
  { code: "P.C. 317", title: "Extortion", description: "The unlawful taking of money or property through intimidation.", jail: 50, fine: 900 },
  { code: "P.C. 318", title: "Corruption", description: "Improper and unlawful conduct intended to secure a benefit for oneself or another.", jail: 55, fine: 1100 },
  { code: "P.C. 319", title: "Fraud", description: "The deliberate misrepresentation of fact for the purpose of depriving someone of a valuable possession.", jail: 20, fine: 10000 },
  { code: "P.C. 320", title: "Forgery", description: "Making and/or possession of a false writing with an intent to defraud.", jail: 30, fine: 600 },
  { code: "P.C. 321", title: "Vandalism", description: "The willful or malicious destruction or defacement of property with malicious intent.", jail: 10, fine: 300, flags: ["Seize"] },
  { code: "P.C. 322", title: "Arson", description: "Starts a fire or causing an explosion with the intent to cause damage after ignition.", jail: 20, fine: 600, flags: ["Seize"] },
  { code: "P.C. 322", title: "Animal Negligence", description: "The act of intentionally putting an animal on a situation of danger that could possibly harm the animal (does not include wild animals).", jail: 20, fine: 700, flags: ["Seize"] },
  { code: "P.C. 323", title: "Animal Abuse", description: "The act of intentionally harming dogs, cats, and birds (does not include wild animals).", jail: 20, fine: 600, flags: ["Seize"] },
  { code: "P.C. 324", title: "Hunting Without a License", description: "The act of operating a weapon designated for hunting without a proper license.", jail: 50, fine: 1500, flags: ["Seize"] },
  { code: "P.C. 325", title: "Possession of Contraband", description: "Has possession of red, blue, or green decryption keys, chips, raspberry chips, fake plates.", jail: 10, fine: 150, flags: ["Per", "Seize"] },
  { code: "P.C. 325", title: "Trafficking of Contraband", description: "Has possession of 11 or more red, blue, or green decryption keys, 11 or more chips, 11 or more raspberry chips, 11 or more fake plates, 11 or more meth tables, 11 or more catalytic converters or 11 or more pagers.", jail: 30, fine: 400, flags: ["Per", "Seize"] },
  { code: "P.C. 326", title: "Possession of Contraband in Crime", description: "Has possession of thermite, lockpicks, tuner chips, or fake plates, and uses them to aid in a crime.", jail: 10, fine: 150, flags: ["Per", "Seize"] },
  { code: "P.C. 327", title: "Breaching Company Regulations", description: "Intentionally disregarded or breached any of the official company regulations set by the government.", jail: 10, fine: 4000, flags: ["Per", "Seize"] },
  { code: "P.C. 327", title: "Trafficking of Contraband in Crime", description: "Has possession of 11 or more thermite, 11 or more lockpicks, 11 or more tuner chips, 11 or more fake plates, 11 or more boosting tablets, 11 or more meth table, 11 or more acetone, 11 or more lithium batteries, 11 or more sawzalls, or 11 or more pagers, and uses it to aid in a crime specific to the contraband that they are being charged for.", jail: 220, fine: 3000 },
  { code: "P.C. 328", title: "Damaging a Communication Device", description: "Individual removes, destroys, or obstructs the use of any wireless communication device with the intent to prevent help.", jail: 40, fine: 600, flags: ["Seize"] },
  { code: "P.C. 329", title: "Using Personal Vehicle", description: "Using Personal / Own Vehicle in any Criminal Situation.", jail: 20, fine: 3000, flags: ["Per", "Seize"] },

  // Disorderly Conduct (400s)
  { code: "P.C. 401", title: "Disorderly Conduct", description: "Intentional disturbing of the public peace and order by language or other conduct.", jail: 10, fine: 400 },
  { code: "P.C. 402", title: "Indecent Exposure", description: "A person commits indecent exposure if that person exposes their genitals in any place a reasonable person would deem public.", jail: 20, fine: 500 },

  // Offenses Against Public Administration (500s)
  { code: "P.C. 501", title: "Bribery", description: "The act of promising to or exchanging property with the corrupt aim of influencing a public official in the discharge of their official duties.", jail: 25, fine: 500 },
  { code: "P.C. 502", title: "Disregarding a Lawful Command", description: "The act of ignoring or disregarding a command given by a peace officer to achieve a reasonable and lawful goal.", jail: 10, fine: 300 },
  { code: "P.C. 503", title: "Impersonation of a Public Servant", description: "The false representation by one person that they are another or that they occupies the position a public servant.", jail: 20, fine: 500 },
  { code: "P.C. 504", title: "Impersonation of a Peace Officer", description: "The false representation by one person that they are another or that they occupies the position a peace officer.", jail: 30, fine: 900 },
  { code: "P.C. 505", title: "Obstruction of Justice", description: "An act that \"corruptly or by threats or force, or by any threatening letter or communication obstructs the due administration of justice.\"", jail: 10, fine: 450 },
  { code: "P.C. 506", title: "Resisting a Peace Officer", description: "A person who avoids or resists apprehension.", jail: 20, fine: 600 },
  { code: "P.C. 507", title: "Felony Resisting a Peace Officer", description: "A person who avoids or resists apprehension with an attempt or threat to use physical violence.", jail: 30, fine: 1000 },
  { code: "P.C. 508", title: "Misuse of a Mobile Hotline", description: "A person who intentionally uses the Government, Police or EMS Hotline for other reasons than emergency purposes.", jail: 5, fine: 500 },
  { code: "P.C. 509", title: "Tampering with Evidence", description: "Alters evidence by any form with intent to mislead a public servant who is or may be engaged in such proceeding or investigation.", jail: 50, fine: 2000 },
  { code: "P.C. 510", title: "Unlawful Arrest", description: "The intentional detention by one person of another without probable cause, a valid arrest warrant, or consent.", jail: 35, fine: 750 },
  { code: "P.C. 511", title: "Contempt of Court", description: "Any form of disturbance that may impede the functioning of the court. The punishment may be greater depending on the severity of disturbance.", jail: 20, fine: 500 },
  { code: "P.C. 512", title: "Breach of Contract", description: "Any form of failure to the terms of a legally binding contract.", jail: 10, fine: 1000 },
  { code: "P.C. 513", title: "Violation of a Court Order", description: "Any form of violation of a legally binding contract presented by a Judge.", jail: 30, fine: 1400 },
  { code: "P.C. 514", title: "Wearing a Disguise to Evade Police", description: "Wearing a mask or disguise to evade recognition or identification in the commission of a crime, or escape when charged with a crime.", jail: 0, fine: 800 },
  { code: "P.C. 515", title: "Providing False Information - Misdemeanor", description: "Less severe instances, like providing false information on less critical forms or during less significant legal procedures, might be charged as misdemeanors. These typically result in lighter penalties such as shorter jail terms, probation, or fines.", jail: 20, fine: 500, flags: ["Per", "Seize"] },
  { code: "P.C. 516", title: "Providing False Information - Felony", description: "More severe cases, such as providing false information during a serious criminal investigation, committing perjury in court, or in cases involving large-scale financial fraud, are more likely to be charged as felonies. These carry more severe penalties, including longer prison sentences.", jail: 40, fine: 1000, flags: ["Per", "Seize"] },

  // Public Peace (600s)
  { code: "P.C. 601", title: "Disturbing the Peace", description: "Unreasonably disrupts the public tranquillity or has a strong tendency to cause a disturbance.", jail: 0, fine: 350 },
  { code: "P.C. 602", title: "Incitement to Riot", description: "Conduct, words, or other means that urge or naturally lead others to riot, violence, or insurrection.", jail: 10, fine: 450 },
  { code: "P.C. 603", title: "Public Intoxication", description: "Being in any area that is not private while under the influence of alcohol and/or drugs.", jail: 5, fine: 300, flags: ["Seize"] },
  { code: "P.C. 604", title: "Public Endangerment", description: "Any person who recklessly engages in conduct which places or may place another person in danger of death or serious bodily injury.", jail: 20, fine: 400, flags: ["Seize"] },
  { code: "P.C. 605", title: "Verbal Harassment", description: "A person with intent to harass, annoy or alarm another with the use of speech.", jail: 10, fine: 300 },
  { code: "P.C. 606", title: "Sexual Harassment", description: "A person with intent to sexually harass another with the use of speech of sexual nature.", jail: 0, fine: 1000000 },
  { code: "P.C. 607", title: "Civil Negligence", description: "Conduct which falls below a standard which a reasonable person would deem safe.", jail: 10, fine: 400 },
  { code: "P.C. 608", title: "Criminal Negligence", description: "Conduct which falls below a standard which a reasonable person would deem safe with the intent to harm another person.", jail: 20, fine: 500, flags: ["Seize"] },

  // Drug Offenses (700s)
  { code: "P.C. 701", title: "Maintaining a Place for Distribution", description: "Having keys to a property for the purpose of selling, giving away, storing, or using any Class B without a sales permit, Class A substance, contraband or illegal weapons.", jail: 45, fine: 1200, flags: ["Seize"] },
  { code: "P.C. 702", title: "Sale of a Controlled Substance", description: "The act of offering, selling, transporting, or giving away a Class B Substance or Class A Substance to another person without a sales permit.", jail: 20, fine: 400, flags: ["Seize"] },
  { code: "P.C. 703", title: "Possession of a Class B Substance", description: "Possession of 11-15 joints without a sales permit, 1-4q of processed or unprocessed weed (4q=1oz), 1-2 acid, or 1-3 lean.", jail: 5, fine: 200, flags: ["Per", "Seize"] },
  { code: "P.C. 704", title: "Intention to Sell a Class B Substance", description: "Possession of 16-24 joints without a sales permit, 5-19q of processed or unprocessed weed (4q=1oz), 3-4 acid, or 4-6 lean, with the clear intention to sell.", jail: 30, fine: 1400, flags: ["Seize"] },
  { code: "P.C. 705", title: "Drug Trafficking of a Class B Substance", description: "Possession of 25 or more joints without a sales permit, 20q or more of processed or unprocessed weed (4q=1oz), 5 or more acid, or 7 or more lean.", jail: 50, fine: 2000, flags: ["Seize"] },
  { code: "P.C. 706", title: "Possession of a Class A Substance", description: "Possession of 1-2 bags of cocaine, 1-2 bags of meth, or 1-2 shrooms.", jail: 10, fine: 500, flags: ["Per", "Seize"] },
  { code: "P.C. 707", title: "Intention to Sell a Class A Substance", description: "Possession of 3-7 bags of cocaine, 3-7 bags of meth, or 3-4 shrooms, with the clear intention to sell.", jail: 50, fine: 2200, flags: ["Seize"] },
  { code: "P.C. 708", title: "Drug Trafficking of a Class A Substance", description: "Possession of 1 or more bricks of cocaine, 8 or more bags of cocaine, 8 or more bags of meth, or 5 or more shrooms.", jail: 70, fine: 4000, flags: ["Seize"] },
  { code: "P.C. 709", title: "Intention to Sell Distilled Spirits", description: "Possession of 3 or more distilled spirits, with the clear intention to sell without a license.", jail: 5, fine: 100, flags: ["Per", "Seize"] },
  { code: "P.C. 710", title: "Possession of Narcotics", description: "Possession of 1 or more narcotics without a prescription from a licensed doctor currently working with or for the EMS.", jail: 10, fine: 400, flags: ["Per", "Seize"] },
  { code: "P.C. 711", title: "Manufacturing Controlled Substances", description: "The manufacturing, producing, or importing of any Narcotics or Class A or B substances without a sales permit.", jail: 35, fine: 1000, flags: ["Seize"] },
  { code: "P.C. 713", title: "Mining Without a License", description: "The activity of extracting gemstones or minerals from the ground without a mining license.", jail: 20, fine: 1000, flags: ["Seize"] },
  { code: "P.C. 714", title: "Mining Without a Scanner", description: "The activity of extracting gemstones or minerals from the ground without a gemstone scanner is considered civil negligence.", jail: 15, fine: 500 },

  // Traffic Violations (800s)
  { code: "P.C. 801", title: "Driving Without a License", description: "Operating a motor vehicle without proper identification. 3 point penalty.", jail: 0, fine: 1500, flags: ["Seize"] },
  { code: "P.C. 802", title: "Driving With a Suspended License", description: "Operating a motor vehicle with a suspended license.", jail: 10, fine: 2000, flags: ["Seize"] },
  { code: "P.C. 803", title: "Hit and Run", description: "Leaving the scene of an accident while operating a vehicle. Failing to stop and render assistance if vehicular accident for which you are at fault. 5 point penalty.", jail: 25, fine: 750, flags: ["Seize"] },
  { code: "P.C. 804", title: "Speeding", description: "The act of driving over the speed limit, or greater than, or in a manner other than is reasonable and prudent for the particular location.", jail: 0, fine: 300 },
  { code: "P.C. 805", title: "Excessive Speeding", description: "The act of driving 30+ mph over the speed limit. 3 point penalty.", jail: 30, fine: 600, flags: ["Seize"] },
  { code: "P.C. 806", title: "Reckless Driving", description: "Operating a motor vehicle in such a manner that has a disregard of public safety.", jail: 20, fine: 600 },
  { code: "P.C. 807", title: "Traffic Violation", description: "Operating a vehicle in any way with disregard to public traffic laws. 2 point penalty.", jail: 0, fine: 200, flags: ["Per"] },
  { code: "P.C. 808", title: "Parking Violation", description: "Parking of a vehicle in any area that isn't designated for public parking. 2 point penalty.", jail: 0, fine: 200, flags: ["Per"] },
  { code: "P.C. 809", title: "Evading a Peace Officer", description: "A person (non-criminal) who has been given a visual or auditory signal by an officer, and willfully refuse to stop or attempts to elude the officer. 4 point penalty.", jail: 15, fine: 350, flags: ["Seize"] },
  { code: "P.C. 810", title: "Felony Evading a Peace Officer", description: "A person who has been given a visual or auditory signal by an officer, and willfully refuse to stop their motor vehicle. 6 point penalty.", jail: 30, fine: 700, flags: ["Seize"] },
  { code: "P.C. 811", title: "Driving Under the Influence (DUI)", description: "Operating a motor vehicle while under the effects of alcohol or drugs. 10 point penalty.", jail: 10, fine: 400, flags: ["Seize"] },
  { code: "P.C. 812", title: "Jaywalking", description: "Crossing any 4 lane (2 in either direction) highway/interstate without using the designated crosswalk.", jail: 0, fine: 50 },
  { code: "P.C. 813", title: "Joyriding", description: "Operating a motor vehicle without explicit permission from the owner of a vehicle (where PC can not be established that the vehicle is stolen).", jail: 10, fine: 350 },
  { code: "P.C. 814", title: "Unauthorized Operations of an Aircraft", description: "Operating an aircraft without the corresponding pilot license of the aircraft being operated. 4 point penalty.", jail: 20, fine: 1500, flags: ["Seize"] },
  { code: "P.C. 815", title: "Reckless Operations of an Aircraft", description: "Operating an aircraft with disregard of public safety. 6 point penalty.", jail: 25, fine: 2500, flags: ["Seize"] },
  { code: "P.C. 816", title: "Tampering with a Motor Vehicle", description: "Injure, tamper, break, or remove any part of a vehicle, or it's contents, without the consent of the owner.", jail: 5, fine: 500, flags: ["Per", "Seize"] },
  { code: "P.C. 816", title: "Improper Operations of an Aircraft", description: "Operating an aircraft in disregard of Aviation SOP's by not engaging on the correct radio channel or by not having the correct tools (Flight radar)", jail: 10, fine: 500 },
  { code: "P.C. 817", title: "Unauthorized Use of Pure Black Tinted Glass", description: "Using fully black tinted glass on a vehicle without legal permission or violating tint regulations.", jail: 0, fine: 500 },
  { code: "P.C. 818", title: "Engaging in a Speed Contest", description: "Engaging in a high-speed motor vehicle race against another vehicle or vehicles. 2 point penalty.", jail: 15, fine: 300, flags: ["Seize"] },

  // Weapons Offenses (900s)
  { code: "P.C. 901", title: "Carrying a Firearm Without a License", description: "Act of carrying and/or concealing a firearm without proper identification/documentation to go along with it.", jail: 25, fine: 400, flags: ["Seize"] },
  { code: "P.C. 902", title: "Brandishing a Weapon", description: "The act of openly carrying a weapon, replica, or similar object in an attempt to elicit fear.", jail: 20, fine: 350, flags: ["Seize"] },
  { code: "P.C. 903", title: "Weapons Discharge Violation", description: "Discharging any firearm within city limits, or in Blaine County on Government Property, without a lawful reason for doing so.", jail: 10, fine: 200, flags: ["Seize"] },
  { code: "P.C. 904", title: "Felony Weapons Discharge Violation", description: "Discharging any firearm without a lawful reason for doing so which endangers the safety of the public.", jail: 20, fine: 400, flags: ["Seize"] },
  { code: "P.C. 905", title: "Display of Tactical Gear", description: "Act of wearing and refusing to remove any tactical vests, or holsters, in plain view of the public.", jail: 5, fine: 200, flags: ["Per", "Seize"] },
  { code: "P.C. 906", title: "Possession of Unregistered Firearm", description: "Act of carrying and/or concealing a firearm that does not have a valid serial number.", jail: 10, fine: 500, flags: ["Per", "Seize"] },
  { code: "P.C. 907", title: "Possession of Class 2 Weapon", description: "Act of carrying and/or concealing a Class 2 weapon that does not have a valid serial number.", jail: 30, fine: 600, flags: ["Per", "Seize"] },
  { code: "P.C. 908", title: "Possession of Class 3 Weapon", description: "Act of carrying and/or concealing a Class 3 weapon that does not have a valid serial number.", jail: 50, fine: 1000, flags: ["Per", "Seize"] },
  { code: "P.C. 909", title: "Trafficking of Class 2 Weapon", description: "Possession of 3 or more Class 2 weapons.", jail: 150, fine: 7000, flags: ["Seize"] },
  { code: "P.C. 909", title: "Possession of Class 4 Weapon", description: "Act of carrying and/or concealing a Class 4 weapon.", jail: 50, fine: 3000, flags: ["Per", "Seize"] },
  { code: "P.C. 910", title: "Trafficking of Class 3 Weapon", description: "Possession of 3 or more Class 3 weapons.", jail: 200, fine: 10000, flags: ["Seize"] },
  { code: "P.C. 911", title: "Possession of Class 5 Weapon", description: "Act of carrying and/or concealing a Class 5 weapon.", jail: 60, fine: 4500, flags: ["Per", "Seize"] },
  { code: "P.C. 912", title: "Possession of Extended Magazines", description: "Any person in possession of any large-capacity magazine, including when it is attached to any weapon, is guilty of a misdemeanor. This shall not apply to a peace officer when on duty.", jail: 10, fine: 500, flags: ["Per", "Seize"] },
  { code: "P.C. 913", title: "Possession of Silencers", description: "Any person in possession of a silencer, including when it is attached to any weapon, is guilty of a felony. This shall not apply to a peace officer when on duty.", jail: 30, fine: 1500, flags: ["Per", "Seize"] },
  { code: "P.C. 913", title: "Trafficking of Class 4 Weapon", description: "Possession of 3 or more Class 4 weapons.", jail: 250, fine: 11000, flags: ["Seize"] },
  { code: "P.C. 914", title: "Unauthorised Sale of Hunting Rifle", description: "Unauthorized Sale of Hunting Rifle: Selling a hunting rifle without proper permission or legal approval.", jail: 30, fine: 4500, flags: ["Per", "Seize"] },
  { code: "P.C. 915", title: "Trafficking of Class 5 Weapon", description: "Possession of 3 or more Class 5 weapons.", jail: 275, fine: 17000, flags: ["Seize"] },

  // Organized Crime (1000s)
  { code: "P.C. 1001", title: "Racketeering", description: "A pattern of committing Criminal Profiteering crimes, which may include Money Laundering, Trafficking and Murder charges.", jail: "HUT", fine: "HUT", flags: ["Seize"] },
  { code: "P.C. 1002", title: "Gaming", description: "Dealing, playing or betting at, or against, any card, banking, or percentage game with dice, cards, or any device for money, credits or other representative of value, outside of a state approved card-room or Diamond Casino.", jail: 0, fine: 0 },
];

export default function DOJPanelCodes() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCodes = DOJ_PENAL_CODES.filter(code =>
    code.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    code.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (value: string | number) => {
    if (value === "HUT") return "HUT";
    if (typeof value === 'number') return `$${value.toLocaleString()}`;
    return value;
  };

  const formatJail = (value: string | number) => {
    if (value === "HUT") return "HUT";
    if (typeof value === 'number') return value === 0 ? "0" : `${value} months`;
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Scale className="w-8 h-8 text-primary" />
            DOJ Panel Codes
          </h1>
          <p className="text-muted-foreground mt-1">
            Department of Justice Penal Code Reference
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search penal codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Legend */}
      <Card className="bg-card border-border">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">HUT</Badge>
              <span className="text-muted-foreground">Hold Until Trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-500">Per</Badge>
              <span className="text-muted-foreground">Per Count Multiplier</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-red-500 text-red-500">Seize</Badge>
              <span className="text-muted-foreground">Item Seizure Required</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[120px] text-primary font-semibold">Code</TableHead>
                  <TableHead className="text-primary font-semibold">Title</TableHead>
                  <TableHead className="hidden lg:table-cell text-primary font-semibold">Description</TableHead>
                  <TableHead className="text-right text-primary font-semibold w-[100px]">Jail</TableHead>
                  <TableHead className="text-right text-primary font-semibold w-[100px]">Fine</TableHead>
                  <TableHead className="text-center text-primary font-semibold w-[120px]">Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.map((code, index) => (
                  <TableRow 
                    key={`${code.code}-${code.title}-${index}`} 
                    className="border-border hover:bg-secondary/30"
                  >
                    <TableCell className="font-mono text-sm font-medium text-foreground">
                      {code.code}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div>
                        <div>{code.title}</div>
                        <div className="lg:hidden text-xs text-muted-foreground mt-1 line-clamp-2">
                          {code.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-md">
                      {code.description}
                    </TableCell>
                    <TableCell className="text-right">
                      {code.jail === "HUT" ? (
                        <Badge variant="destructive" className="text-xs">HUT</Badge>
                      ) : (
                        <span className="text-foreground">{formatJail(code.jail)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {code.fine === "HUT" ? (
                        <Badge variant="destructive" className="text-xs">HUT</Badge>
                      ) : (
                        <span className="text-foreground">{formatCurrency(code.fine)}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {code.flags?.map((flag) => (
                          <Badge 
                            key={flag} 
                            variant="outline" 
                            className={`text-xs ${
                              flag === 'Per' 
                                ? 'border-yellow-500 text-yellow-500' 
                                : flag === 'Seize' 
                                  ? 'border-red-500 text-red-500'
                                  : ''
                            }`}
                          >
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {filteredCodes.length === 0 && (
        <Card className="bg-card">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No results found
            </h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search terms
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="text-sm text-muted-foreground text-center">
        Showing {filteredCodes.length} of {DOJ_PENAL_CODES.length} penal codes
      </div>
    </div>
  );
}
