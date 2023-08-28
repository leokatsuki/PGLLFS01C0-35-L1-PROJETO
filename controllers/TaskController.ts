import { getLast12Months } from "../utils/date"

export default class TaskController {
    months = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]

    getData(){
        const months = getLast12Months();
        const labels = ["Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho", "Julho"]
        return {
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Dataset 1',
                        data: [24, 424, 946, 361, 87, 203, 902],
                        backgroundColor: 'rgba(255,99,132,0.5)',
                    },
                ]
            }
        }
    }
}