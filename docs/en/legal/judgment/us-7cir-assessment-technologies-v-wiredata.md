POSNER, Circuit J.

This case is about the attempt of a copyright owner to use copyright law to block access to data that not
only are neither copyrightable nor copyrighted, but were not created or obtained by the copyright owner. The owner
is trying to secrete the data in its copyrighted program—a program the existence of which reduced the likelihood that
the data would be retained in a form in which they would have been readily accessible. It would be appalling if such
an attempt could succeed.

Assessment Technologies (AT, we'll call it) brought suit for copyright infringement and theft of trade
secrets against WIREdata, and the district court after an evidentiary hearing issued a permanent injunction on the
basis of AT's copyright claim alone, without reaching the trade secret claim. A sample database in the demo version
of AT's product—a version freely distributed for promotional purposes—reveals the entire structure of the database,
thus making the trade secret claim incomprehensible to us. But we shall not make a formal ruling on the claim. It
was not addressed either by the district court or by the parties in their submissions in this court, and conceivably if
improbably it has more merit than we can find in it.

The copyright case seeks to block WIREdata from obtaining noncopyrighted data. AT claims that the data
can't be extracted without infringement of its copyright. The copyright is of a compilation, and the general issue that
the appeal presents is the right of the owner of such a copyright to prevent his customers (that is, the copyright
licensees) from disclosing the compiled data even if the data are in the public domain.

WIREdata, owned by Multiple Listing Services, Inc., wants to obtain, for use by real estate brokers, data
regarding specific properties—address, owner's name, the age of the property, its assessed valuation, the number and
type of rooms, and so forth—from the southeastern Wisconsin municipalities in which the properties are located. The
municipalities collect such data in order to assess the value of the properties for property-tax purposes. Ordinarily
they're happy to provide the data to anyone who will pay the modest cost of copying the data onto a disk. Indeed,
Wisconsin's "open records" law, Wis. Stat. §§ 19.31–.39;
State ex rel. Milwaukee Police Ass'n v. Jones, 237 Wis.2d 840, 615 N.W.2d 190, 194–96 (Wis.App.2000),
which is applicable to data in digital form, see id. at 195–96; Wis. Stat. § 19.32(2),
requires them to furnish such data to any person who will pay the copying cost. However, three
municipalities refused WIREdata's request. They (or the contractors who do the actual tax assessment for them) are
licensees of AT. The open-records law contains an exception for copyrighted materials, id., and these municipalities
are afraid that furnishing WIREdata the requested data would violate the copyright. WIREdata has sued them in the
state courts of Wisconsin in an attempt to force them to divulge the data, and those suits are pending. Alarmed by
WIREdata's suits, AT brought the present suit to stop WIREdata from making such demands of the municipalities
and seeking to enforce them by litigation.

The data that WIREdata wants are collected not by AT but by tax assessors hired by the municipalities. The
assessors visit the property and by talking to the owner and poking around the property itself obtain the information
that we mentioned in the preceding paragraph—the age of the property, the number of rooms, and so forth. AT has
developed and copyrighted a computer program, called "Market Drive," for compiling these data. The assessor types
into a computer the data that he has obtained from his visit to the property or from other sources of information and
then the Market Drive program, in conjunction with a Microsoft database program (Microsoft Access),
automatically allocates the data to 456 fields (that is, categories of information) grouped into 34 master categories
known as tables. Several types of data relating to a property, each allocated to a different field, are grouped together
in a table called "Income Valuations," others in a table called "Residential Buildings," and so on. The data collected
by the various assessors and inputted in the manner just described are stored in an electronic file, the database. The
municipality's tax officials can use various queries in Market Drive or Market Access to view the data in the file.

WIREdata's appeal gets off on the wrong foot, with the contention that Market Drive lacks sufficient
originality to be copyrightable. Copyright law unlike patent law does not require substantial originality.
Feist Publications, Inc. v. Rural Telephone Service Co., 499 U.S. 340, 345–48 (1991). In fact, it requires only
enough originality to enable a work to be distinguished from similar works that are in the public domain,
Bucklew v. Hawkins, Ash, Baptie & Co., 329 F.3d 923, 929 (7th Cir.2003);
Alfred Bell & Co. v. Catalda Fine Arts, Inc., 191 F.2d 99, 102-03 (2d Cir.1951),
since without some discernible distinction it would be impossible to determine
whether a subsequent work was copying a copyrighted work or a public-domain work. This modest requirement is
satisfied by Market Drive because no other real estate assessment program arranges the data collected by the
assessor in these 456 fields grouped into these 34 categories, and because this structure is not so obvious or
inevitable as to lack the minimal originality required,
Key Publications, Inc. v. Chinatown Today Publishing Enterprises, Inc., 945 F.2d 509, 513–14 (2d Cir.1991),
as it would if the compilation simply listed the data in alphabetical or numerical order.
Feist Publications, Inc. v. Rural Telephone Service Co., supra, 499 U.S. at 362–64.
The obvious orderings, the lexical and the numeric, have long been in the public domain, and what is in the public
domain cannot be appropriated by claiming copyright. Alternatively, if there is only one way in which to express an
idea—for example, alphabetical order for the names in a phone book—then form and idea merge, and in that case
since an idea cannot be copyrighted the copying of the form is not an infringement.
Ets-Hokin v. Skyy Spirits, Inc., 225 F.3d 1068, 1082 (9th Cir.2000);
Kregos v. Associated Press, 937 F.2d 700, 705–07 (2d Cir.1991).
That is not the situation here.

So AT has a valid copyright; and if WIREdata said to itself, "Market Drive is a nifty way of sorting real
estate data and we want the municipalities to give us their data in the form in which it is organized in the database,
that is, sorted into AT's 456 fields grouped into its 34 tables," and the municipalities obliged, they would be
infringing AT's copyright because they are not licensed to make copies of Market Drive for distribution to others;
and WIREdata would be a contributory infringer (subject to a qualification concerning the fair-use defense to
copyright infringement, including contributory infringement, that we discuss later). But WIREdata doesn't want the
Market Drive compilation. It isn't in the business of making tax assessments, which is the business for which Market
Drive is designed. It only wants the raw data, the data the assessors inputted into Market Drive. Once it gets those
data it will sort them in accordance with its own needs, which have to do with providing the information about
properties that is useful to real estate brokers as opposed to taxing authorities.

But how are the data to be extracted from the database without infringing the copyright? Or, what is not
quite the same question, how can the data be separated from the tables and fields to which they are allocated by
Market Drive? One possibility is to use tools in the Market Drive program itself to extract the data and place it in a
separate electronic file; this can be done rapidly and easily with just a few keystrokes. But the municipalities may
not have the program, because the inputting of the data, which did of course require its use, was done by assessors
employed by firms to do this work as independent contractors of the municipalities. And if the municipalities do
have the program, still their license from AT forbids them to disseminate the data collected by means of it—a
restriction that may or may not be in violation of the state's open-records law, a question we come back to later. A
second extraction possibility, which arises from the fact that the database is a Microsoft file accessible by
Microsoft Access, is to use Access to extract the data and place it in a new file, bypassing Market Drive. But there
is again the scope of the license to be considered and also whether the method of extraction is so cumbersome that it would
require more effort than the open-records law requires of the agencies subject to it. It might take a programmer a
couple of days to extract the data using Microsoft Access, and the municipalities might lack the time, or for that
matter the programmers, to do the extraction. But that should not be a big problem, because WIREdata can hire
programmers to extract the data from the municipalities' computers at its own expense.

From the standpoint of copyright law all that matters is that the process of extracting the raw data from the
database does not involve copying Market Drive, or creating, as AT mysteriously asserts, a derivative work; all that
is sought is raw data, data created not by AT but by the assessors, data that are in the public domain. A derivative
work is a translation or other transformation of an original work and must itself contain minimum originality for the
same evidentiary reason that we noted in discussing the requirement that a copyrighted work be original.
Pickett v. Prince, 207 F.3d 402, 405 (7th Cir.2000);
Gracen v. Bradford Exchange, 698 F.2d 300, 304–05 (7th Cir.1983).
A work that merely copies uncopyrighted material is wholly unoriginal and the making of such a work is therefore not
an infringement of copyright. The municipalities would not be infringing Market Drive by extracting the raw data
from the databases by either method that we discussed and handing those data over to WIREdata; and since there
would thus be no direct infringement, neither would there be contributory infringement by WIREdata. It would be
like a Westlaw licensee's copying the text of a federal judicial opinion that he found in the Westlaw opinion
database and giving it to someone else. Westlaw's compilation of federal judicial opinions is copyrighted and
copyrightable because it involves discretionary judgments regarding selection and arrangement. But the opinions
themselves are in the public domain (federal law forbids assertion of copyright in federal documents,
17 U.S.C. § 105), and so Westlaw cannot prevent its
licensees from copying the opinions themselves as distinct from the aspects
of the database that are copyrighted.
See Matthew Bender & Co. v. West Publishing Co., 158 F.3d 693 (2d Cir.1998);
Matthew Bender & Co. v. West Publishing Co., 158 F.3d 674 (2d Cir. 1998).

AT would lose this copyright case even if the raw data were so entangled with Market Drive that they could
not be extracted without making a copy of the program. The case would then be governed by
Sega Enterprises Ltd. v. Accolade, Inc., 977 F.2d 1510, 1520–28 (9th Cir. 1992).
Sega manufactured a game console, which is a specialized
computer, and copyrighted the console's operating system, including the source code. Accolade wanted to make
computer games that would be compatible with Sega's console, and to that end it bought a Sega console and through
reverse engineering reconstructed the source code, from which it would learn how to design its games so that they
would activate the operating system. For technical reasons, Accolade had to make a copy of the source code in order
to be able to obtain this information. It didn't want to sell the source code, produce a game-console operating system,
or make any other use of the copyrighted code except to be able to sell a noninfringing product, namely a computer
game. The court held that this "intermediate copying" of the operating system was a fair use, since the only effect
of enjoining it would be to give Sega control over noninfringing products, namely Accolade's games. See also
Sony Computer Entertainment, Inc. v. Connectix Corp., 203 F.3d 596, 602–08 (9th Cir. 2000);
Bateman v. Mnemonics, Inc., 79 F.3d 1532, 1539–40 n. 18 (11th Cir. 1996);
Atari Games Corp. v. Nintendo of America, Inc., 975 F.2d 832, 842–44 (Fed. Cir. 1992).
Similarly, if the only way WIREdata could obtain public-domain data about properties in
southeastern Wisconsin would be by copying the data in the municipalities' databases as embedded in Market Drive,
so that it would be copying the compilation and not just the compiled data only because the data and the format in
which they were organized could not be disentangled, it would be privileged to make such a copy, and likewise the
municipalities. For the only purpose of the copying would be to extract noncopyrighted material, and not to go into
competition with AT by selling copies of Market Drive. We emphasize this point lest AT try to circumvent our
decision by reconfiguring Market Drive in such a way that the municipalities would find it difficult or impossible to
furnish the raw data to requesters such as WIREdata in any format other than that prescribed by Market Drive. If AT
did that with that purpose it might be guilty of copyright misuse, of which more shortly.

AT argues that WIREdata doesn't need to obtain the data in digital form because they exist in analog form,
namely in the handwritten notes of the assessors, notes that all agree are not covered by the Market Drive copyright.
But we were told at argument without contradiction that some assessors no longer make handwritten notes to copy
into a computer at a later time. Instead they take their laptop to the site and type the information in directly. So
WIREdata could not possibly obtain all the data it wants (all of which data are in the public domain, we emphasize)
from the handwritten notes. But what is more fundamental is that since AT has no ownership or other legal interest
in the data collected by the assessor, it has no legal ground for making the acquisition of that data more costly for
WIREdata. AT is trying to use its copyright to sequester uncopyrightable data, presumably in the hope of extracting
a license fee from WIREdata.

We are mindful of pressures, reflected in bills that have been pending in Congress for years,
Jonathan Band & Makoto Kono, The Database Protection Debate in the 106th Congress, 62 Ohio St. L.J. 869 (2001),
to provide legal protection to the creators of databases, as Europe has already done.
Jane C. Ginsburg, Copyright, Common Law, and Sui Generis Protection of Databases in the United States and Abroad, 66 U. Cinc. L.Rev. 151 (1997).
(Ironically, considering who owns WIREdata, the multiple-listing services are pressing for such protection. Ron
Eckstein, The Database Debate, Legal Times, Jan. 24, 2000, p. 16.) The creation of massive electronic databases
can be extremely costly, yet if the database is readily searchable and the data themselves are not copyrightable (and
we know from Feist that mere data are indeed not copyrightable) the creator may find it difficult or even impossible
to recoup the expense of creating the database. Legal protection of databases as such (as distinct from programs for
arranging the data, like Market Drive) cannot take the form of copyright, as the Supreme Court made clear in Feist
when it held that the copyright clause of the Constitution does not authorize Congress to create copyright in mere
data. But that is neither here nor there; what needs to be emphasized in this case is that the concerns (whether or not
valid, as questioned in Ginsburg, supra, and also
J. H. Reichman & Pamela Samuelson, Intellectual Property Rights in Data? 50 Vand. L.Rev. 51 (1997), and
Stephen M. Maurer & Suzanne Scotchmer, Database Protection: Is It Broken and Should We Fix It? 284 Sci. 1129 (1999)) that actuate the legislative proposals for database protection
have no relevance because AT is not the collector of the data that go into the database. All the data are collected and
inputted by the assessors; it is they, not AT, that do the footwork, the heavy lifting.

AT points to the terms of its license agreements with the municipalities, which though ambiguous might be
interpreted to forbid the licensees to release the raw data, even without the duplication, or revelation of any
copyrighted feature, of Market Drive. But AT is not suing for breach of the terms of the agreements—it can't, since
WIREdata is not a party to them. Nor is it suing for intentional interference with contract,
Frandsen v. Jensen-Sundquist Agency, Inc., 802 F.2d 941, 947–48 (7th Cir. 1986) (Wisconsin law);
Dorr v. Sacred Heart Hospital, 228 Wis.2d 425, 597 N.W.2d 462, 478 (Wis.App. 1999);
Cudd v. Crownhart, 122 Wis.2d 656, 364 N.W.2d 158, 160–61 (Wis.App. 1985),
which would be the logical route for complaining about WIREdata's inviting the municipalities
that are AT's licensees to violate the terms of their license. The licenses do nothing for AT in this case.

So it is irrelevant that ProCD, Inc. v. Zeidenberg, 86 F.3d 1447, 1453–55 (7th Cir. 1996), holds that a
copyright owner can by contract limit copying beyond the right that a copyright confers.
See also Bowers v. Baystate Technologies, Inc., 320 F.3d 1317, 1323–26 (Fed. Cir. 2003).
Like other property rights, a copyright is enforceable
against persons with whom the owner has no contractual relations; so a property owner can eject a trespasser even
though the trespasser had not contractually bound himself to refrain from entering the property. That is why AT is
suing WIREdata for copyright infringement rather than for breach of contract. The scope of a copyright is given by
federal law, but the scope of contractual protection is, at least prima facie, whatever the parties to the contract agreed
to. The existence of contractual solutions to the problem of copying the contents of databases is one of the reasons
that Professor Ginsburg and others are skeptical about the need for legislative protection of databases. But our
plaintiff did not create the database that it is seeking to sequester from WIREdata; or to be more precise, it created
only an empty database, a bin that the tax assessors filled with the data. It created the compartments in the bin and
the instructions for sorting the data to those compartments, but those were its only innovations and their protection
by copyright law is complete. To try by contract or otherwise to prevent the municipalities from revealing their own
data, especially when, as we have seen, the complete data are unavailable anywhere else, might constitute copyright
misuse….

We need not run this hare to the ground; nor decide whether the licenses interpreted as AT would have us
interpret them—as barring municipalities from disclosing noncopyrighted data—would violate the state's open-records
law.
Cf. Antisdel v. City of Oak Creek Police & Fire Comm'n, 229 Wis.2d 433, 600 N.W.2d 1, 3 (Wis.App. 1999);
Gordie Boucher Lincoln-Mercury Madison, Inc. v. J & H Landfill, Inc., 172 Wis.2d 333, 493 N.W.2d 375, 378 (Wis.App. 1992);
State ex rel. Sun Newspapers v. Westlake Board of Education, 76 Ohio App.3d 170, 601 N.E.2d 173, 175 (Ohio App. 1991);
but cf. Pierce v. St. Vrain Valley School District, 981 P.2d 600, 605–06 (Colo. 1999).
WIREdata is not a licensee of AT, and AT is not suing to enforce any contract it might have with
WIREdata. It therefore had no cause to drag the licenses before us. But since it did, we shall not conceal our
profound skepticism concerning AT's interpretation. If accepted, it would forbid municipalities licensed by AT to
share the data in their tax-assessment databases with each other even for the purpose of comparing or coordinating
their assessment methods, though all the data they would be exchanging would be data that their assessors had
collected and inputted into the databases. That seems an absurd result.

To summarize, there are at least four possible methods by which WIRE data can obtain the data it is
seeking without infringing AT's copyright; which one is selected is for the municipality to decide in light of
applicable trade-secret, open-records, and contract laws. The methods are:
1. the municipalities use Market Drive to extract the data and place it in an electronic file;
1. they use Microsoft Access to create an electronic file of the data;
1. they allow programmers furnished by WIREdata to use their computers to extract the data from their database—this is really just an alternative to WIREdata's paying the municipalities' cost of extraction, which the open-records law requires;
1. they copy the database file and give it to WIREdata to extract the data from.

The judgment is reversed with instructions to vacate the injunction and dismiss the copyright claim.

REVERSED AND REMANDED, WITH INSTRUCTIONS.
