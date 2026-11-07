setInterval(() => {
    let continueBtn = document.querySelector(".css-1bnidmp")
    if (continueBtn) {
        continueBtn.click()
    }
    let elements = document.querySelectorAll("[data-cellnumber]")
if (elements.length > 0) [...elements].sort((a,b)=>a.getAttribute("data-cellnumber")-b.getAttribute("data-cellnumber"))[0].click()
    
})
