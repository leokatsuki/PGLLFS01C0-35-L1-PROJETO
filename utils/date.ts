const getLast12Months = () => {
    const currentDate = new Date();
    const months: String[] = [];
    const monthToBase: String[] = [];
    let month = currentDate.getMonth()

    for (let i = 0; i < 12; i++) {
        let year = currentDate.getFullYear() 

        if(month < 0){
            year -= 1
            month += 12 
        }

        months.push(`${month}/${year}`)
        monthToBase.push(`${year}-${month}`)

        month = currentDate.getMonth() - i
    }

    return [
        months.reverse(),
        monthToBase.reverse(),
    ];
}

export { getLast12Months }