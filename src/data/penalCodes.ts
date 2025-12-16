export interface PenalCode {
  code: string;
  title: string;
  description: string;
  jail: number | 'HUT';
  fine: number | 'HUT';
  flags: string[];
}

export const PENAL_CODES: PenalCode[] = [
  // Title 2 - Crimes Against Persons
  { code: 'P.C. 201', title: 'Criminal Threat', description: 'Intentionally puts another in the belief of physical harm or offensive contact.', jail: 10, fine: 300, flags: [] },
  { code: 'P.C. 202', title: 'Assault and Battery', description: 'Uses violence to cause physical harm to another person without a weapon.', jail: 20, fine: 800, flags: [] },
  { code: 'P.C. 203', title: 'Aggravated Assault and Battery', description: 'Uses violence to cause physical harm to another person with a weapon.', jail: 40, fine: 1000, flags: ['Seize'] },
  { code: 'P.C. 203-2', title: 'Second Degree Aggravated Assault and Battery', description: 'A spontaneous act of violence using a deadly weapon or dangerous object to cause physical harm to another person, without premeditation or intent to kill.', jail: 40, fine: 1000, flags: ['Seize'] },
  { code: 'P.C. 204', title: 'Torture', description: 'Causes extreme pain and suffering to another person.', jail: 70, fine: 1200, flags: ['Seize'] },
  { code: 'P.C. 204-2', title: 'First Degree Aggravated Assault and Battery', description: 'A premeditated and deliberate attack on another person with the intent to cause serious harm or death.', jail: 60, fine: 1500, flags: ['Seize'] },
  { code: 'P.C. 205', title: 'Terroristic Threat', description: 'Intentionally puts another in the belief or fear of an act of terrorism happening.', jail: 30, fine: 1000, flags: ['Seize'] },
  { code: 'P.C. 206', title: 'Terrorism', description: 'A violent, criminal act committed by a person to further goals stemming from political, religious, social, or environmental influences.', jail: 'HUT', fine: 'HUT', flags: ['Seize'] },
  { code: 'P.C. 206-2', title: 'Maiming', description: 'The act of disabling, disfiguring, removing or permanently damaging a person\'s limbs either intentionally or in a fight.', jail: 350, fine: 4000, flags: ['Per', 'Seize'] },
  { code: 'P.C. 207', title: 'Attempted Murder', description: 'Attempts to perform a premeditated killing of another person with malice.', jail: 80, fine: 1500, flags: ['Seize'] },
  { code: 'P.C. 208', title: 'Involuntary Manslaughter', description: 'Acted recklessly and negligently which resulted in the death of another person.', jail: 'HUT', fine: 'HUT', flags: ['Seize'] },
  { code: 'P.C. 209', title: 'Voluntary Manslaughter', description: 'Acted in the heat of passion caused by being reasonably and strongly provoked which resulted in the death of another person.', jail: 'HUT', fine: 'HUT', flags: ['Seize'] },
  { code: 'P.C. 210', title: 'Second Degree Murder', description: 'Performs a non-premeditated killing of another person, resulting from an assault where death was a possibility.', jail: 'HUT', fine: 'HUT', flags: ['Seize'] },
  { code: 'P.C. 211', title: 'First Degree Murder', description: 'Performs a premeditated killing with malice.', jail: 'HUT', fine: 'HUT', flags: ['Seize'] },
  { code: 'P.C. 212', title: 'False Imprisonment', description: 'A person who intentionally and unlawfully restrains, detains, or confines another person.', jail: 10, fine: 600, flags: [] },
  { code: 'P.C. 213', title: 'Kidnapping', description: 'Intentionally took another person from point A to point B without consent.', jail: 50, fine: 1000, flags: ['Seize'] },
  { code: 'P.C. 214', title: 'Fraudulent', description: 'Fraudulent Fine 5000 + fraud amount.', jail: 120, fine: 5000, flags: ['Seize'] },
  { code: 'P.C. 215', title: 'Destructive Use of Blasting Agents', description: 'Intentionally using an incendiary/explosive device to cause harm to another person.', jail: 85, fine: 2500, flags: ['Seize'] },
  { code: 'P.C. 215-2', title: 'No Plate Second Time', description: 'Not having Number Plate Second Time. 4 Day Seize.', jail: 0, fine: 6000, flags: ['Seize'] },
  { code: 'P.C. 214-2', title: 'No Plate First Time', description: 'Not having Number Plate First Time. 2 Day Seize.', jail: 0, fine: 3000, flags: ['Seize'] },

  // Title 3 - Crimes Against Property
  { code: 'P.C. 301', title: 'Loitering', description: 'Fails to leave property when asked to do so by a relevant representative of the property.', jail: 10, fine: 250, flags: [] },
  { code: 'P.C. 302', title: 'Trespassing', description: 'Enters, or remains on land and fails to leave, which noted that entry was forbidden.', jail: 10, fine: 300, flags: [] },
  { code: 'P.C. 303', title: 'Trespassing on Government Property', description: 'Trespasses specifically on Government Property.', jail: 15, fine: 950, flags: [] },
  { code: 'P.C. 304', title: 'Burglary', description: 'The act of entering property with the intent to commit a crime. For vehicles specifically, this is known as Auto-Burglary.', jail: 25, fine: 600, flags: ['Seize'] },
  { code: 'P.C. 305', title: 'Robbery', description: 'The unlawful taking of property from the person of another through the use of threat or force.', jail: 25, fine: 400, flags: ['Seize'] },
  { code: 'P.C. 306', title: 'Armed Robbery', description: 'The unlawful taking of property from the person of another by the use of a weapon.', jail: 40, fine: 650, flags: ['Seize'] },
  { code: 'P.C. 307', title: 'Armed Robbery of a Shop', description: 'The unlawful taking of property within a store with the use of a weapon.', jail: 40, fine: 1000, flags: ['Seize'] },
  { code: 'P.C. 308', title: 'Armed Robbery of a Bank', description: 'The unlawful taking of property within a bank with the use of a weapon.', jail: 90, fine: 2000, flags: ['Seize'] },
  { code: 'P.C. 309', title: 'Armed Robbery of a Stockade', description: 'The unlawful taking of property within a Stockade or armored vehicle with the use of a weapon.', jail: 120, fine: 2500, flags: ['Seize'] },
  { code: 'P.C. 310', title: 'Armed Robbery of a Jewellery Store', description: 'The unlawful taking of property within a Jewellery Store with the use of a weapon.', jail: 150, fine: 3000, flags: ['Seize'] },
  { code: 'P.C. 311', title: 'Theft', description: 'Takes personal property of another without permission or consent.', jail: 10, fine: 200, flags: ['Per'] },
  { code: 'P.C. 312', title: 'Grand Theft', description: 'Taking the property of another illegally with the intent to deprive the owner of that property. Value exceeding $3000.', jail: 15, fine: 1000, flags: ['Per'] },
  { code: 'P.C. 313', title: 'Grand Theft Auto', description: 'Taking the vehicle of another illegally with the intent to deprive the owner of that vehicle.', jail: 30, fine: 1000, flags: [] },
  { code: 'P.C. 314', title: 'Destruction of Private Property', description: 'Willful destruction or damaging of property in a manner that defaces, mars, or otherwise adds a physical blemish.', jail: 10, fine: 350, flags: [] },
  { code: 'P.C. 315', title: 'Possession of Stolen Property', description: 'Has possession of property not belonging to them and the owner has reported said items stolen.', jail: 10, fine: 350, flags: ['Per', 'Seize'] },
  { code: 'P.C. 316', title: 'Receiving Stolen Property', description: 'Individual has accepted possession of goods or property and knew they were stolen.', jail: 25, fine: 400, flags: [] },
  { code: 'P.C. 317', title: 'Extortion', description: 'The unlawful taking of money or property through intimidation.', jail: 50, fine: 900, flags: [] },
  { code: 'P.C. 318', title: 'Corruption', description: 'Improper and unlawful conduct intended to secure a benefit for oneself or another.', jail: 55, fine: 1100, flags: [] },
  { code: 'P.C. 319', title: 'Fraud', description: 'The deliberate misrepresentation of fact for the purpose of depriving someone of a valuable possession.', jail: 20, fine: 10000, flags: [] },
  { code: 'P.C. 320', title: 'Forgery', description: 'Making and/or possession of a false writing with an intent to defraud.', jail: 30, fine: 600, flags: [] },
  { code: 'P.C. 321', title: 'Vandalism', description: 'The willful or malicious destruction or defacement of property with malicious intent.', jail: 10, fine: 300, flags: ['Seize'] },
  { code: 'P.C. 322', title: 'Arson', description: 'Starts a fire or causing an explosion with the intent to cause damage after ignition.', jail: 20, fine: 600, flags: ['Seize'] },
  { code: 'P.C. 322-2', title: 'Animal Negligence', description: 'The act of intentionally putting an animal in a situation of danger that could possibly harm the animal.', jail: 20, fine: 700, flags: ['Seize'] },
  { code: 'P.C. 323', title: 'Animal Abuse', description: 'The act of intentionally harming dogs, cats, and birds (does not include wild animals).', jail: 20, fine: 600, flags: ['Seize'] },
  { code: 'P.C. 324', title: 'Hunting Without a License', description: 'The act of operating a weapon designated for hunting without a proper license.', jail: 50, fine: 1500, flags: ['Seize'] },
  { code: 'P.C. 325', title: 'Possession of Contraband', description: 'Has possession of red, blue, or green decryption keys, chips, raspberry chips, fake plates.', jail: 10, fine: 150, flags: ['Per', 'Seize'] },
  { code: 'P.C. 325-2', title: 'Trafficking of Contraband', description: 'Has possession of 11+ decryption keys, chips, raspberry chips, fake plates, meth tables, catalytic converters or pagers.', jail: 30, fine: 400, flags: ['Per', 'Seize'] },
  { code: 'P.C. 326', title: 'Possession of Contraband in Crime', description: 'Has possession of thermite, lockpicks, tuner chips, or fake plates, and uses them to aid in a crime.', jail: 10, fine: 150, flags: ['Per', 'Seize'] },
  { code: 'P.C. 327', title: 'Breaching Company Regulations', description: 'Intentionally disregarded or breached any of the official company regulations set by the government.', jail: 10, fine: 4000, flags: ['Per', 'Seize'] },
  { code: 'P.C. 327-2', title: 'Trafficking of Contraband in Crime', description: 'Has possession of 11+ thermite, lockpicks, tuner chips, fake plates, boosting tablets, meth table, acetone, lithium batteries, sawzalls, or pagers, and uses it to aid in a crime.', jail: 220, fine: 3000, flags: [] },
  { code: 'P.C. 328', title: 'Damaging a Communication Device', description: 'Individual removes, destroys, or obstructs the use of any wireless communication device with the intent to prevent help.', jail: 40, fine: 600, flags: ['Seize'] },
  { code: 'P.C. 329', title: 'Using Personal Vehicle', description: 'Using Personal / Own Vehicle in any Criminal Situation.', jail: 20, fine: 3000, flags: ['Per', 'Seize'] },

  // Title 4 - Crimes Against Public Decency
  { code: 'P.C. 401', title: 'Disorderly Conduct', description: 'Intentional disturbing of the public peace and order by language or other conduct.', jail: 10, fine: 400, flags: [] },
  { code: 'P.C. 402', title: 'Indecent Exposure', description: 'A person commits indecent exposure if that person exposes their genitals in any place a reasonable person would deem public.', jail: 20, fine: 500, flags: [] },

  // Title 5 - Crimes Against Public Justice
  { code: 'P.C. 501', title: 'Bribery', description: 'The act of promising to or exchanging property with the corrupt aim of influencing a public official in the discharge of their official duties.', jail: 25, fine: 500, flags: [] },
  { code: 'P.C. 502', title: 'Disregarding a Lawful Command', description: 'The act of ignoring or disregarding a command given by a peace officer to achieve a reasonable and lawful goal.', jail: 10, fine: 300, flags: [] },
  { code: 'P.C. 503', title: 'Impersonation of a Public Servant', description: 'The false representation by one person that they are another or that they occupies the position a public servant.', jail: 20, fine: 500, flags: [] },
  { code: 'P.C. 504', title: 'Impersonation of a Peace Officer', description: 'The false representation by one person that they are another or that they occupies the position a peace officer.', jail: 30, fine: 900, flags: [] },
  { code: 'P.C. 505', title: 'Obstruction of Justice', description: 'An act that "corruptly or by threats or force, or by any threatening letter or communication obstructs the due administration of justice."', jail: 10, fine: 450, flags: [] },
  { code: 'P.C. 506', title: 'Resisting a Peace Officer', description: 'A person who avoids or resists apprehension.', jail: 20, fine: 600, flags: [] },
  { code: 'P.C. 507', title: 'Felony Resisting a Peace Officer', description: 'A person who avoids or resists apprehension with an attempt or threat to use physical violence.', jail: 30, fine: 1000, flags: [] },
  { code: 'P.C. 508', title: 'Misuse of a Mobile Hotline', description: 'A person who intentionally uses the Government, Police or EMS Hotline for other reasons than emergency purposes.', jail: 5, fine: 500, flags: [] },
  { code: 'P.C. 509', title: 'Tampering with Evidence', description: 'Alters evidence by any form with intent to mislead a public servant who is or may be engaged in such proceeding or investigation.', jail: 50, fine: 2000, flags: [] },
  { code: 'P.C. 510', title: 'Unlawful Arrest', description: 'The intentional detention by one person of another without probable cause, a valid arrest warrant, or consent.', jail: 35, fine: 750, flags: [] },
  { code: 'P.C. 511', title: 'Contempt of Court', description: 'Any form of disturbance that may impede the functioning of the court.', jail: 20, fine: 500, flags: [] },
  { code: 'P.C. 512', title: 'Breach of Contract', description: 'Any form of failure to the terms of a legally binding contract.', jail: 10, fine: 1000, flags: [] },
  { code: 'P.C. 513', title: 'Violation of a Court Order', description: 'Any form of violation of a legally binding contract presented by a Judge.', jail: 30, fine: 1400, flags: [] },
  { code: 'P.C. 514', title: 'Wearing a Disguise to Evade Police', description: 'Wearing a mask or disguise to evade recognition or identification in the commission of a crime, or escape when charged with a crime.', jail: 0, fine: 800, flags: [] },
  { code: 'P.C. 515', title: 'Providing False Information - Misdemeanor', description: 'Less severe instances, like providing false information on less critical forms or during less significant legal procedures.', jail: 20, fine: 500, flags: ['Per', 'Seize'] },
  { code: 'P.C. 516', title: 'Providing False Information - Felony', description: 'More severe cases, such as providing false information during a serious criminal investigation, committing perjury in court, or in cases involving large-scale financial fraud.', jail: 40, fine: 1000, flags: ['Per', 'Seize'] },

  // Title 6 - Crimes Against Public Health and Safety
  { code: 'P.C. 601', title: 'Disturbing the Peace', description: 'Unreasonably disrupts the public tranquility or has a strong tendency to cause a disturbance.', jail: 0, fine: 350, flags: [] },
  { code: 'P.C. 602', title: 'Incitement to Riot', description: 'Conduct, words, or other means that urge or naturally lead others to riot, violence, or insurrection.', jail: 10, fine: 450, flags: [] },
  { code: 'P.C. 603', title: 'Public Intoxication', description: 'Being in any area that is not private while under the influence of alcohol and/or drugs.', jail: 5, fine: 300, flags: ['Seize'] },
  { code: 'P.C. 604', title: 'Public Endangerment', description: 'Any person who recklessly engages in conduct which places or may place another person in danger of death or serious bodily injury.', jail: 20, fine: 400, flags: ['Seize'] },
  { code: 'P.C. 605', title: 'Verbal Harassment', description: 'A person with intent to harass, annoy or alarm another with the use of speech.', jail: 10, fine: 300, flags: [] },
  { code: 'P.C. 606', title: 'Sexual Harassment', description: 'A person with intent to sexually harass another with the use of speech of sexual nature.', jail: 0, fine: 1000000, flags: [] },
  { code: 'P.C. 607', title: 'Civil Negligence', description: 'Conduct which falls below a standard which a reasonable person would deem safe.', jail: 10, fine: 400, flags: [] },
  { code: 'P.C. 608', title: 'Criminal Negligence', description: 'Conduct which falls below a standard which a reasonable person would deem safe with the intent to harm another person.', jail: 20, fine: 500, flags: ['Seize'] },

  // Title 7 - Crimes Against Controlled Substances
  { code: 'P.C. 701', title: 'Maintaining a Place for Distribution', description: 'Having keys to a property for the purpose of selling, giving away, storing, or using any Class B without a sales permit, Class A substance, contraband or illegal weapons.', jail: 45, fine: 1200, flags: ['Seize'] },
  { code: 'P.C. 702', title: 'Sale of a Controlled Substance', description: 'The act of offering, selling, transporting, or giving away a Class B Substance or Class A Substance to another person without a sales permit.', jail: 20, fine: 400, flags: ['Seize'] },
  { code: 'P.C. 703', title: 'Possession of a Class B Substance', description: 'Possession of 11-15 joints without a sales permit, 1-4q of processed or unprocessed weed, 1-2 acid, or 1-3 lean.', jail: 5, fine: 200, flags: ['Per', 'Seize'] },
  { code: 'P.C. 704', title: 'Intention to Sell a Class B Substance', description: 'Possession of 16-24 joints without a sales permit, 5-19q of weed, 3-4 acid, or 4-6 lean, with the clear intention to sell.', jail: 30, fine: 1400, flags: ['Seize'] },
  { code: 'P.C. 705', title: 'Drug Trafficking of a Class B Substance', description: 'Possession of 25+ joints without a sales permit, 20q+ of weed, 5+ acid, or 7+ lean.', jail: 50, fine: 2000, flags: ['Seize'] },
  { code: 'P.C. 706', title: 'Possession of a Class A Substance', description: 'Possession of 1-2 bags of cocaine, 1-2 bags of meth, or 1-2 shrooms.', jail: 10, fine: 500, flags: ['Per', 'Seize'] },
  { code: 'P.C. 707', title: 'Intention to Sell a Class A Substance', description: 'Possession of 3-7 bags of cocaine, 3-7 bags of meth, or 3-4 shrooms, with the clear intention to sell.', jail: 50, fine: 2200, flags: ['Seize'] },
  { code: 'P.C. 708', title: 'Drug Trafficking of a Class A Substance', description: 'Possession of 1+ bricks of cocaine, 8+ bags of cocaine, 8+ bags of meth, or 5+ shrooms.', jail: 70, fine: 4000, flags: ['Seize'] },
  { code: 'P.C. 709', title: 'Intention to Sell Distilled Spirits', description: 'Possession of 3+ distilled spirits, with the clear intention to sell without a license.', jail: 5, fine: 100, flags: ['Per', 'Seize'] },
  { code: 'P.C. 710', title: 'Possession of Narcotics', description: 'Possession of 1+ narcotics without a prescription from a licensed doctor currently working with or for the EMS.', jail: 10, fine: 400, flags: ['Per', 'Seize'] },
  { code: 'P.C. 711', title: 'Manufacturing Controlled Substances', description: 'The manufacturing, producing, or importing of any Narcotics or Class A or B substances without a sales permit.', jail: 35, fine: 1000, flags: ['Seize'] },
  { code: 'P.C. 713', title: 'Mining Without a License', description: 'The activity of extracting gemstones or minerals from the ground without a mining license.', jail: 20, fine: 1000, flags: ['Seize'] },
  { code: 'P.C. 714', title: 'Mining Without a Scanner', description: 'The activity of extracting gemstones or minerals from the ground without a gemstone scanner is considered civil negligence.', jail: 15, fine: 500, flags: [] },

  // Title 8 - Crimes Against Motor Vehicles
  { code: 'P.C. 801', title: 'Driving Without a License', description: 'Operating a motor vehicle without proper identification.', jail: 0, fine: 1500, flags: ['Seize'] },
  { code: 'P.C. 802', title: 'Driving With a Suspended License', description: 'Operating a motor vehicle with a suspended license.', jail: 10, fine: 2000, flags: ['Seize'] },
  { code: 'P.C. 803', title: 'Hit and Run', description: 'Leaving the scene of an accident while operating a vehicle. Failing to stop and render assistance if vehicular accident for which you are at fault.', jail: 25, fine: 750, flags: ['Seize'] },
  { code: 'P.C. 804', title: 'Speeding', description: 'The act of driving over the speed limit.', jail: 0, fine: 300, flags: [] },
  { code: 'P.C. 805', title: 'Excessive Speeding', description: 'The act of driving 30+ mph over the speed limit.', jail: 30, fine: 600, flags: ['Seize'] },
  { code: 'P.C. 806', title: 'Reckless Driving', description: 'Operating a motor vehicle in such a manner that has a disregard of public safety.', jail: 20, fine: 600, flags: [] },
  { code: 'P.C. 807', title: 'Traffic Violation', description: 'Operating a vehicle in any way with disregard to public traffic laws.', jail: 0, fine: 200, flags: ['Per'] },
  { code: 'P.C. 808', title: 'Parking Violation', description: 'Parking of a vehicle in any area that isn\'t designated for public parking.', jail: 0, fine: 200, flags: ['Per'] },
  { code: 'P.C. 809', title: 'Evading a Peace Officer', description: 'A person (non-criminal) who has been given a visual or auditory signal by an officer, and willfully refuse to stop or attempts to elude the officer.', jail: 15, fine: 350, flags: ['Seize'] },
  { code: 'P.C. 810', title: 'Felony Evading a Peace Officer', description: 'A person who has been given a visual or auditory signal by an officer, and willfully refuse to stop their motor vehicle.', jail: 30, fine: 700, flags: ['Seize'] },
  { code: 'P.C. 811', title: 'Driving Under the Influence (DUI)', description: 'Operating a motor vehicle while under the effects of alcohol or drugs.', jail: 10, fine: 400, flags: ['Seize'] },
  { code: 'P.C. 812', title: 'Jaywalking', description: 'Crossing any 4 lane highway/interstate without using the designated crosswalk.', jail: 0, fine: 50, flags: [] },
  { code: 'P.C. 813', title: 'Joyriding', description: 'Operating a motor vehicle without explicit permission from the owner of a vehicle.', jail: 10, fine: 350, flags: [] },
  { code: 'P.C. 814', title: 'Unauthorized Operations of an Aircraft', description: 'Operating an aircraft without the corresponding pilot license of the aircraft being operated.', jail: 20, fine: 1500, flags: ['Seize'] },
  { code: 'P.C. 815', title: 'Reckless Operations of an Aircraft', description: 'Operating an aircraft with disregard of public safety.', jail: 25, fine: 2500, flags: ['Seize'] },
  { code: 'P.C. 816', title: 'Tampering with a Motor Vehicle', description: 'Injure, tamper, break, or remove any part of a vehicle, or its contents, without the consent of the owner.', jail: 5, fine: 500, flags: ['Per', 'Seize'] },
  { code: 'P.C. 816-2', title: 'Improper Operations of an Aircraft', description: 'Operating an aircraft in disregard of Aviation SOPs by not engaging on the correct radio channel or by not having the correct tools.', jail: 10, fine: 500, flags: [] },
  { code: 'P.C. 817', title: 'Unauthorized Use of Pure Black Tinted Glass', description: 'Using fully black tinted glass on a vehicle without legal permission or violating tint regulations.', jail: 0, fine: 500, flags: [] },
  { code: 'P.C. 818', title: 'Engaging in a Speed Contest', description: 'Engaging in a high-speed motor vehicle race against another vehicle or vehicles.', jail: 15, fine: 300, flags: ['Seize'] },

  // Title 9 - Crimes Against Weapons
  { code: 'P.C. 901', title: 'Carrying a Firearm Without a License', description: 'Act of carrying and/or concealing a firearm without proper identification/documentation to go along with it.', jail: 25, fine: 400, flags: ['Seize'] },
  { code: 'P.C. 902', title: 'Brandishing a Weapon', description: 'The act of openly carrying a weapon, replica, or similar object in an attempt to elicit fear.', jail: 20, fine: 350, flags: ['Seize'] },
  { code: 'P.C. 903', title: 'Weapons Discharge Violation', description: 'Discharging any firearm within city limits, or in Blaine County on Government Property, without a lawful reason for doing so.', jail: 10, fine: 200, flags: ['Seize'] },
  { code: 'P.C. 904', title: 'Felony Weapons Discharge Violation', description: 'Discharging any firearm without a lawful reason for doing so which endangers the safety of the public.', jail: 20, fine: 400, flags: ['Seize'] },
  { code: 'P.C. 905', title: 'Display of Tactical Gear', description: 'Act of wearing and refusing to remove any tactical vests, or holsters, in plain view of the public.', jail: 5, fine: 200, flags: ['Per', 'Seize'] },
  { code: 'P.C. 906', title: 'Possession of Unregistered Firearm', description: 'Act of carrying and/or concealing a firearm that does not have a valid serial number.', jail: 10, fine: 500, flags: ['Per', 'Seize'] },
  { code: 'P.C. 907', title: 'Possession of Class 2 Weapon', description: 'Act of carrying and/or concealing a Class 2 weapon that does not have a valid serial number.', jail: 30, fine: 600, flags: ['Per', 'Seize'] },
  { code: 'P.C. 908', title: 'Possession of Class 3 Weapon', description: 'Act of carrying and/or concealing a Class 3 weapon that does not have a valid serial number.', jail: 50, fine: 1000, flags: ['Per', 'Seize'] },
  { code: 'P.C. 909', title: 'Trafficking of Class 2 Weapon', description: 'Possession of 3+ Class 2 weapons.', jail: 150, fine: 7000, flags: ['Seize'] },
  { code: 'P.C. 909-2', title: 'Possession of Class 4 Weapon', description: 'Act of carrying and/or concealing a Class 4 weapon.', jail: 50, fine: 3000, flags: ['Per', 'Seize'] },
  { code: 'P.C. 910', title: 'Trafficking of Class 3 Weapon', description: 'Possession of 3+ Class 3 weapons.', jail: 200, fine: 10000, flags: ['Seize'] },
  { code: 'P.C. 910-2', title: 'Possession of Class 5 Weapon', description: 'Act of carrying and/or concealing a Class 5 weapon.', jail: 60, fine: 4500, flags: ['Per', 'Seize'] },
  { code: 'P.C. 911', title: 'Possession of Extended Magazines', description: 'Any person in possession of any large-capacity magazine, including when it is attached to any weapon.', jail: 10, fine: 500, flags: ['Per', 'Seize'] },
  { code: 'P.C. 912', title: 'Possession of Silencers', description: 'Any person in possession of a silencer, including when it is attached to any weapon.', jail: 30, fine: 1500, flags: ['Per', 'Seize'] },
  { code: 'P.C. 913', title: 'Unauthorised Sale of Hunting Rifle', description: 'Unauthorized Sale of Hunting Rifle: Selling a hunting rifle without proper permission or legal approval.', jail: 30, fine: 4500, flags: ['Per', 'Seize'] },
  { code: 'P.C. 913-2', title: 'Trafficking of Class 4 Weapon', description: 'Possession of 3+ Class 4 weapons.', jail: 250, fine: 11000, flags: ['Seize'] },
  { code: 'P.C. 914', title: 'Trafficking of Class 5 Weapon', description: 'Possession of 3+ Class 5 weapons.', jail: 275, fine: 17000, flags: ['Seize'] },

  // Title 10 - Racketeering
  { code: 'P.C. 1001', title: 'Racketeering', description: 'A pattern of committing Criminal Profiteering crimes, which may include Money Laundering, Trafficking and Murder charges.', jail: 'HUT', fine: 'HUT', flags: ['Seize'] },
  { code: 'P.C. 1002', title: 'Gaming', description: 'Dealing, playing or betting at, or against, any card, banking, or percentage game with dice, cards, or any device for money, outside of a state approved card-room or Diamond Casino.', jail: 0, fine: 0, flags: [] },
];

export interface EnhancementMultiplier {
  code: string;
  abbreviation: string;
  title: string;
  description: string;
  multiplier: number; // percentage as decimal (e.g., 0.25 for 25%)
  seize: boolean;
}

export const ENHANCEMENT_MULTIPLIERS: EnhancementMultiplier[] = [
  { code: 'P.C. 1101', abbreviation: 'ACP', title: 'Accomplice', description: 'Any person not present when the crime itself is committed, but has knowledge of the crime before or after the fact, and may assist in its commission.', multiplier: 0.25, seize: true },
  { code: 'P.C. 1102', abbreviation: 'ACC', title: 'Accessory', description: 'Any person who aids in the commission of a crime without prior knowledge of the crime being committed.', multiplier: 0.75, seize: true },
  { code: 'P.C. 1103', abbreviation: 'AAA', title: 'Aiding and Abetting', description: 'Any person who aids in the commission of a crime shall be given the same punishment as if the offense was committed.', multiplier: 1.0, seize: true },
  { code: 'P.C. 1104', abbreviation: 'APP', title: 'Applicability', description: 'Charges labelled with Per as defined in TITLE 1. can be stacked, taking care to only add additional times and fines if it states PER next to the time and fines.', multiplier: 1.0, seize: true },
  { code: 'P.C. 1105', abbreviation: 'ATT', title: 'Attempt', description: 'A person who attempts to commit any crime but fails, is prevented, or is intercepted, shall be given the same punishment as if the offense was committed.', multiplier: 1.0, seize: true },
  { code: 'P.C. 1106', abbreviation: 'CON', title: 'Conspiracy', description: 'A person who conspires to commit any crime shall be given the same punishment as if the offense was committed.', multiplier: 1.0, seize: true },
  { code: 'P.C. 1107', abbreviation: 'SOL', title: 'Soliciting', description: 'A person who solicits for the commission or perpetration of any crime shall be given similar punishments as if the offense was committed.', multiplier: 0.5, seize: true },
  { code: 'P.C. 1108', abbreviation: 'GE', title: 'Gang Enhancement', description: 'Any criminal activity with 2 or more known gang members involved shall be given a harsher total time and fine to deter future offenses.', multiplier: 1.5, seize: false },
  { code: 'P.C. 1109', abbreviation: 'PP', title: 'Protected Persons', description: 'Any criminal activity targeted at a public servant or peace officer shall be given a harsher total time and fine to deter future offenses.', multiplier: 1.2, seize: false },
  { code: 'P.C. 1110', abbreviation: 'PM', title: 'Public Menace', description: 'Any person convicted of a serious felony who previously has been convicted of a serious felony is subject to an increase on their sentence. (Manually add 600 months)', multiplier: 1.0, seize: false },
  { code: 'P.C. 1111', abbreviation: 'ITS', title: 'Intent to Sell', description: 'A person who shows clear intent to sell; drugs, contraband or weaponry shall be given a harsher total time and fine to deter future offences.', multiplier: 1.5, seize: true },
  { code: 'P.C. 1112', abbreviation: 'P-Prop', title: 'Protected Property', description: 'Any criminal activity targeted at a public servant\'s or peace officer\'s property or government property shall be given a harsher total time and fine to deter future offences.', multiplier: 1.2, seize: false },
];

export const PLEAD_OPTIONS = ['Guilty', 'Not Guilty', 'No Contest'];

export interface ChargeWithCount {
  charge: PenalCode;
  count: number;
}

export function calculateTotals(
  charges: ChargeWithCount[],
  selectedEnhancements: EnhancementMultiplier[] = []
): { totalJail: number | 'HUT'; totalFine: number | 'HUT'; isHUT: boolean } {
  let totalJail = 0;
  let totalFine = 0;
  let isHUT = false;

  for (const { charge, count } of charges) {
    if (charge.jail === 'HUT' || charge.fine === 'HUT') {
      isHUT = true;
    } else {
      const multiplier = charge.flags.includes('Per') ? count : 1;
      totalJail += charge.jail * multiplier;
      totalFine += charge.fine * multiplier;
    }
  }

  // Apply enhancement multipliers (they stack additively)
  if (selectedEnhancements.length > 0 && !isHUT) {
    const totalMultiplier = selectedEnhancements.reduce((sum, e) => sum + e.multiplier, 0);
    totalJail = Math.round(totalJail * totalMultiplier);
    totalFine = Math.round(totalFine * totalMultiplier);
  }

  return {
    totalJail: isHUT ? 'HUT' : totalJail,
    totalFine: isHUT ? 'HUT' : totalFine,
    isHUT
  };
}
