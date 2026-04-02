// Pseudo-code of what's happening
const URLSearchParams = require('url').URLSearchParams;

// State
const searchQuery = 'Ambler';
let searchParamsString = 'q=Ambler'; 

// Render loop simulation:
for(let i=0; i<5; i++) {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    
    // simulate missing activeCategories logic for simplicity

    const sp1 = new URLSearchParams(params.toString());
    const sp2 = new URLSearchParams(searchParamsString);
    sp1.sort();
    sp2.sort();
    
    console.log(`Loop ${i}:`);
    console.log(`sp1: `, sp1.toString());
    console.log(`sp2: `, sp2.toString());
    console.log(`match? `, sp1.toString() === sp2.toString());
    
    if (sp1.toString() !== sp2.toString()) {
        const newSearch = params.toString() ? `?${params.toString()}` : '';
        console.log(`Redirecting to /${newSearch}`);
        searchParamsString = params.toString(); // router updates URL
    } else {
        console.log("No redirect.");
        break;
    }
}
