import moment from 'moment';
import queryString from 'query-string';


const URL = 'https://api.themoviedb.org/3';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/w1280';
const POSTER_URL = 'https://image.tmdb.org/t/p/w500';
const PROFILE_URL = 'https://image.tmdb.org/t/p/h632';


export function getParameter(context, key){
    const parameters = queryString.parse(context.props.location.search);
    return parameters[key] || null;
}

export function requestHeader() {
    return {
        method: 'GET',
        headers: {
            'Accept': 'application/json'
        },
    }
}

export function requestURL(endpoint, params) {

    if (params === null) {
        params = [];
    }

    // add default params
    params.push({
        key: 'api_key',
        val: process.env.REACT_APP_TMDB_API_KEY
    });
    params.push({
        key: 'include_adult',
        val: false
    });
    params.push({
        key: 'include_video',
        val: false
    });

    let paramArr = [];
    for (let param of params) {
        const paramStr = param.key + '=' + param.val;
        paramArr.push(paramStr);
    }

    return URL + endpoint + '?' + paramArr.join('&');
}

export function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function now() {
    return moment().toDate();
}

export function oneMonthBefore() {
    return moment().subtract(1, 'months');
}

export function formatDate(date) {
    if (date !== null) {
        return moment(date).format('YYYY-MM-DD');
    }
    return '';
}

function formatFullDate(date){
    if (date !== null) {
        return moment(date).format('D MMMM YYYY');
    }
    return '';
}

// 123m --> 2h 3m
function formatMinutes(minutes) {
    if (minutes === null) {
        return '?';
    }

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    if (m === 0) {
        return h + 'h';
    }
    return h + 'h ' + m + 'm';

}

export function getYear(date) {
    if (date === null || date === '') {
        return null;
    }
    return moment(date).year();
}

function formatCurrency(amount) {
    if (amount === "") {
        return '0';
    }

    let formatedAmount = '';
    if (typeof amount === 'number') {
        formatedAmount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
        formatedAmount = parseFloat(amount.replace(/\,/g, "")).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    return '$' + formatedAmount;
}

function handleNull(input, ifNull, result) {
    if (input === null || input === '' || input === 0 || input.length === 0) {
        return ifNull;
    }
    return result;
}

export function getBackdropURL(path) {
    return (path === null) ? null : BACKDROP_URL + path;
}

export function getPosterURL(path) {
    return (path === null) ? null : POSTER_URL + path;
}

export function getProfileURL(path) {
    return (path === null) ? null : PROFILE_URL + path;
}

export function getYoutubeURL(key) {
    return`https://www.youtube.com/embed/${key}?autoplay=1&enablejsapi=1&version=3`;
}

export function getVideoThumbnail(videoId) {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export function filterSearchResults(rawData) {
    let filteredData = [];
    for (let data of rawData) {

        const mediaType = data.media_type;

        if(mediaType === 'movie') {
            const movie = {
                mediaType,
                id: data.id,
                title: data.title,
                poster: getPosterURL(data.poster_path),
                rate: data.vote_average,
                releaseYear: getYear(data.release_date),
            }
            filteredData.push(movie);
        }
        if(mediaType === 'person') {
            const job = data.known_for_department;
            if(job === 'Acting' || job === 'Production' || job === 'Directing'){
                const person = {
                    mediaType,
                    id: data.id,
                    name: data.name,
                    photo: getProfileURL(data.profile_path),
                    character: '',      // unused, just to prevent nullable for cast component
                }
                filteredData.push(person);
            }
        }  
    }
    return filteredData
}


// for /discover results
export function filterMovies(rawData) {
    let filteredData = [];
    for (let data of rawData) {

        // ignore movie with no poster or backdrop
        // if (data.poster_path === null || data.backdrop_path === null) {
        //     continue;
        // }

        const fd = {
            mediaType: 'movie',
            id: data.id,
            title: data.title,
            poster: getPosterURL(data.poster_path),
            backdrop: getBackdropURL(data.backdrop_path),
            rate: data.vote_average,
            vote: data.vote_count,
            releaseYear: getYear(data.release_date),
        }
        filteredData.push(fd);
    }
    return filteredData;
}

// for /movie result
export function filterMovie(rawData) {

    let ids = rawData.external_ids;
    ids.homepage = rawData.homepage || null ;

    let movie = {
        id: rawData.id,
        title: rawData.title,
        overview: rawData.overview,
        poster: getPosterURL(rawData.poster_path),
        backdrop: getBackdropURL(rawData.backdrop_path),
        rate: rawData.vote_average,
        vote: rawData.vote_count,
        genres: rawData.genres,
        shortGenre: getShortGenre(rawData.genres),
        release: formatFullDate(rawData.release_date),
        releaseYear: getYear(rawData.release_date),
        productions: productionList(rawData.production_companies),
        budget: handleNull(rawData.budget, '?', formatCurrency(rawData.budget)),
        revenue: handleNull(rawData.revenue, '?', formatCurrency(rawData.revenue)),
        duration: formatMinutes(rawData.runtime), // in minutes
        director: getDirector(rawData.credits.crew),    // {id, name}
        cast: getTopCast(rawData.credits.cast), // {id, name, character, picture}
        trailer: getTrailer(rawData.videos.results),
        social: ids,
        backdrops: rawData.images.backdrops,
        posters: rawData.images.posters,
        videos: rawData.videos.results
    }

    return movie;
}

export function filterPersons(rawData) {
    let filteredData = [];
    for (let data of rawData) {
        
        if (data.profile_path === null) {
            continue;
        }

        let fd = {
            mediaType: 'person',
            id: data.id,
            name: data.name,
            photo: getProfileURL(data.profile_path),
        }
        filteredData.push(fd);
    }
    return filteredData;
}

export function filterPerson(rawData) {

    let socialIds = rawData.external_ids;
    socialIds.homepage = rawData.homepage;

    const casts = rawData.movie_credits.cast;
    const crews = rawData.movie_credits.crew;
    let credits = crews;
    crews.push(...casts);

    credits = credits.sort(compareCredits);

    const {filteredMovies, filteredCredits} = filterCredits(credits);

    let person = {
        id: rawData.id,
        name: rawData.name,
        photo: getProfileURL(rawData.profile_path),
        biography: rawData.biography,
        knownFor: rawData.known_for_department,
        birthday: `${formatFullDate(rawData.birthday)} (age ${getAge(rawData.birthday)})`,
        placeBirth: rawData.place_of_birth,
        social: socialIds,
        photos: rawData.images.profiles,
        movies: filteredMovies,
        credits: filteredCredits,
    }

    return person;
}

function filterCredits(credits) {

    let filteredMovies = [];
    let filteredCredits = []

    for (let data of credits){

        // ignore movie with less information
        let releaseYear = getYear(data.release_date);
        if(releaseYear === null){
            continue;
        }

        let asCrew = data.hasOwnProperty('job');
        if(asCrew){
            if(data.job !== 'Director' && data.job !== 'Producer'){
                continue;
            }
        }

        let role = asCrew ? data.job : data.character;
        role = role || '?';

        const fd = {
            id: data.id,
            title: data.title,
            poster: getPosterURL(data.poster_path),
            rate: data.vote_average,
            releaseYear: releaseYear,
            role: role,
        }
        filteredCredits.push(fd);

        // checking array object contain a value
        if(filteredMovies.filter(d => d.id === data.id).length > 0) {
            continue;
        }
        filteredMovies.push(fd);

    }
    
    return {filteredMovies, filteredCredits};
}

function getTrailer(videos) {
    for (let v of videos) {
        if(v.type === 'Trailer' && v.site === 'YouTube'){
            return getYoutubeURL(v.key);
        }
    }
    return '';
}


function getDirector(crew) {
    let id = '';
    let name = '?';
    for (let c of crew) {
        if (c.job === 'Director') {
            id = c.id;
            name = c.name;
            break;
        }
    }
    return {id, name};
}

function isDirector(known_for){
    return (known_for === 'Directing' || known_for === 'Production');
}

function getTopCast(casts) {
    let cast = [];
    for (let i = 0; i < casts.length; i++) {

        if(casts[i].profile_path === null){
            continue;
        }

        const c = {
            id: casts[i].id,
            name: casts[i].name,
            character: casts[i].character,
            photo: PROFILE_URL + casts[i].profile_path
        }
        cast.push(c);
    }

    return cast;
}

function getShortGenre(genres) {
    if (genres === null || genres.length === 0) {
        return '';
    }
    if (genres.length < 2) {
        let genre = (genres[0].name === 'Science Fiction') ? 'Sci-Fi' : genres[0].name;
        return genre;
    }

    let genre1 = (genres[0].name === 'Science Fiction') ? 'Sci-Fi' : genres[0].name;
    let genre2 = (genres[1].name === 'Science Fiction') ? 'Sci-Fi' : genres[1].name;
    
    return `${genre1}/${genre2}`;
}

export function getShortOverview(overview){
    const words = overview.split(' ');
    if(words.length > 31){
        return words.splice(0, 30).join(' ') + '...';
    }
    return overview
}

export function more(data, url) {
    let m = {
        id: '00',
        more: url
    }
    data.push(m);
    
    return data;
}

export function productionList(productions) {
    let companies = [];
    productions.map((p) => companies.push(p.name) );

    return companies.join(', ');
}

function getAge(birthdate) {
    return moment().year() - moment(birthdate).year();
}

function compareCredits(a, b){
    let yearA = getYear(a.release_date) || 5000;
    let yearB = getYear(b.release_date) || 5000;

    if(yearA > yearB){
        return -1;
    }
    return 1;
}
